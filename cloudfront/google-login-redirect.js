// Lambda@Edge (viewer-request, "Include body"): ollarai-landing-google-login-redirect
// Receives the POST that Google's OAuth endpoint sends to redirect_uri on mobile (response_type=id_token,
// response_mode=form_post, see src/login.js) and bounces the ID token back to the login page in the hash:
//   POST /auth/google  id_token=<ID token>           -> 303 /login/#google_credential=<ID token>
//   POST /auth/google  error=access_denied&...       -> 303 /login/#google_error=access_denied
// (GIS redirect mode, used before, POSTs the token as `credential`; still accepted.)
// The page signs in with it via supabase.auth.signInWithIdToken and the nonce it kept in sessionStorage.
// Nothing is verified here: Supabase checks the token, and the nonce check rejects a token that wasn't
// requested by that tab. The hash keeps the token out of access logs.
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
    var params = new URLSearchParams(body);
    var credential = params.get('id_token') || params.get('credential');
    var hash = credential
        ? 'google_credential=' + encodeURIComponent(credential)
        : 'google_error=' + encodeURIComponent(params.get('error') || 'no_token');

    return {
        status: '303',
        statusDescription: 'See Other',
        headers: {
            location: [{ key: 'Location', value: '/login/#' + hash }],
            'cache-control': [{ key: 'Cache-Control', value: 'no-store' }],
        },
    };
};
