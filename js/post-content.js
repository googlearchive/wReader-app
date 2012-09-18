window.addEventListener('message', function(event) {
  if (event.data.type != 'loadContent') return;

  document.body.innerHTML = event.data.content;

  // we have to intercept all link clicks in the sandboxed iframe and send a message to the main app context to open
  // the link
  getAllLinks().forEach(function(node) {
    node.addEventListener('click', function(e) {
      e.preventDefault();
      window.parent.postMessage({type: 'openUrl', url: node.href}, '*');
    }, false);
  });
}, false);


function getAllLinks() {
  return [].splice.call(document.querySelectorAll('a[href]'), 0);
}
