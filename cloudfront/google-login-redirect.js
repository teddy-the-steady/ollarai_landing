// Lambda@Edge (viewer-request, "Include body"): ollarai-landing-google-login-redirect
// Receives the POST that Google Identity Services redirect mode (mobile, see src/login.js) sends to
// login_uri, and bounces the ID token back to the login page in the hash:
//   POST /auth/google  credential=<ID token>&g_csrf_token=...
//     -> 303 /login/#google_credential=<ID token>
// The page signs in with it via supabase.auth.signInWithIdToken and the nonce it kept in sessionStorage.
// Nothing is verified here: Supabase checks the token, and the nonce check rejects a token that wasn't
// requested by that tab (so g_csrf_token isn't needed). The hash keeps the token out of access logs.
//
// Setup:
//   - Lambda in us-east-1 (Node.js), publish a version, attach it to a /auth/google cache behavior
//     as viewer-request with "Include body" on
//   - That behavior: allowed methods GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE; CachingDisabled
//   - Google Cloud Console > OAuth client > Authorized redirect URIs: https://<domain>/auth/google
exports.handler = async (event) => {
    var request = event.Records[0].cf.request;
    if (request.method !== 'POST' || !request.body || !request.body.data) {
        return { status: '405', statusDescription: 'Method Not Allowed' };
    }

    var body = request.body.encoding === 'base64'
        ? Buffer.from(request.body.data, 'base64').toString()
        : request.body.data;
    var credential = new URLSearchParams(body).get('credential') || '';

    return {
        status: '303',
        statusDescription: 'See Other',
        headers: {
            location: [{ key: 'Location', value: '/login/#google_credential=' + encodeURIComponent(credential) }],
            'cache-control': [{ key: 'Cache-Control', value: 'no-store' }],
        },
    };
};
