function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-question').forEach(b => b.setAttribute('aria-expanded','false'));
  if (!isOpen) {
    answer.classList.add('open');
    btn.setAttribute('aria-expanded','true');
  }
}

(function() {
  var sticky = document.getElementById('amzSticky');
  var btn = document.getElementById('amzClose');
  if (!sticky || !btn) return;
  if (localStorage.getItem('amzClosed')) { sticky.style.display = 'none'; }
  btn.onclick = function() {
    sticky.style.display = 'none';
    localStorage.setItem('amzClosed', '1');
  };
})();
