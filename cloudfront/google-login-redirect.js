// Lambda@Edge (viewer-request): ollarai-landing-google-login-redirect
// redirect_uri of the mobile Google sign-in (authorization code flow, see src/login.js). Exchanges the code
// for an ID token and bounces it back to the login page in the hash:
//   GET /auth/google?code=...              -> 303 /login/#google_credential=<ID token>
//   GET /auth/google?error=access_denied   -> 303 /login/#google_error=access_denied
// The page signs in with it via supabase.auth.signInWithIdToken and the nonce it kept in sessionStorage.
// Supabase checks the token; the nonce check rejects a token that wasn't requested by that tab.
// The hash keeps the token out of access logs (the code in the query is single-use and spent here).
//
// Why a code flow of our own: every flow where Google POSTs the ID token to us (GIS redirect mode,
// response_type=id_token&response_mode=form_post) ends in a bare accounts.google.com 500 on iOS for some
// signed-in sessions, and the Supabase redirect names the Supabase domain on Google's screen.
//
// Setup:
//   - Lambda in us-east-1 (Node.js 20), publish a version, attach it to the /auth/google cache behavior
//     as viewer-request; that behavior uses CachingDisabled
//   - Client secret: SSM SecureString /ollarai/google-oauth-client-secret in us-east-1; the role needs
//     ssm:GetParameter on it (Lambda@Edge has no environment variables)
//   - Google Cloud Console > OAuth client > Authorized redirect URIs: https://<domain>/auth/google
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const CLIENT_ID = '196135412344-6j1fq2tfu0ofbu42kr1k8ksm3i8rf2r2.apps.googleusercontent.com';
const SECRET_PARAM = '/ollarai/google-oauth-client-secret';
const ssm = new SSMClient({ region: 'us-east-1' }); // replicas run in other regions; the parameter lives here
let clientSecret = null; // cached per container

async function getClientSecret() {
    if (!clientSecret) {
        const out = await ssm.send(new GetParameterCommand({ Name: SECRET_PARAM, WithDecryption: true }));
        clientSecret = out.Parameter.Value;
    }
    return clientSecret;
}

async function exchangeCode(code, redirectUri) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: CLIENT_ID,
            client_secret: await getClientSecret(),
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }),
        signal: AbortSignal.timeout(4000), // viewer-request Lambdas get 5 s
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.id_token) {
        console.error('token exchange failed', res.status, data.error, data.error_description);
        return null;
    }
    return data.id_token;
}

function backToLogin(hash) {
    return {
        status: '303',
        statusDescription: 'See Other',
        headers: {
            location: [{ key: 'Location', value: '/login/#' + hash }],
            'cache-control': [{ key: 'Cache-Control', value: 'no-store' }],
        },
    };
}

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;

    // Old mobile flow (ID token POSTed by Google), still accepted while cached pages run the old login.js
    if (request.method === 'POST' && request.body && request.body.data) {
        const body = request.body.encoding === 'base64'
            ? Buffer.from(request.body.data, 'base64').toString()
            : request.body.data;
        const params = new URLSearchParams(body);
        const credential = params.get('id_token') || params.get('credential');
        return backToLogin(credential
            ? 'google_credential=' + encodeURIComponent(credential)
            : 'google_error=' + encodeURIComponent(params.get('error') || 'no_token'));
    }

    if (request.method !== 'GET') {
        return { status: '405', statusDescription: 'Method Not Allowed' };
    }

    const params = new URLSearchParams(request.querystring);
    const code = params.get('code');
    if (!code) return backToLogin('google_error=' + encodeURIComponent(params.get('error') || 'no_code'));

    // Must equal the redirect_uri the page sent to Google
    const redirectUri = 'https://' + request.headers.host[0].value + '/auth/google';
    let idToken = null;
    try {
        idToken = await exchangeCode(code, redirectUri);
    } catch (error) {
        console.error('token exchange error', error);
    }
    return backToLogin(idToken
        ? 'google_credential=' + encodeURIComponent(idToken)
        : 'google_error=exchange_failed');
};
