// CloudFront Function (viewer-request): ollarai-landing-locale-redirect
// Maps directory-style URLs to their index.html in S3.
//   /           -> /index.html
//   /ko, /ko/   -> /index.html   (Korean lives at the root)
//   /en, /en/   -> /en/index.html
//   /privacy/   -> /privacy/index.html
// Unknown paths 403 at S3 and fall back to /index.html via the distribution's custom error responses.
function handler(event) {
    var uri = event.request.uri;

    if (uri === '/ko' || uri === '/ko/') { event.request.uri = '/index.html'; }
    else if (uri.endsWith('/'))          { event.request.uri = uri + 'index.html'; }
    else if (!uri.includes('.'))         { event.request.uri = uri + '/index.html'; }

    return event.request;
}
