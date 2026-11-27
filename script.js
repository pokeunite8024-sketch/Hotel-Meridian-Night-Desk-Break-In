// Answers are SHA-256 hashes, and the flag is encrypted with the master key.
const H = {'u': '99e77175ac770d279e803d71ea0d87ec0b8cc9adfb08b84f8811012b51c14d74', 'p': 'd1c2208cb388b536442e76bcc100cabed1034ef4c03050fd280c2d4176d41740', 'c': '36dad61fb9af7a7a16b553199b7d50a9e3bb5af1abbaa57fa8979a32309568a2', 'm': 'a6b9a14cdff828b2d6069751781f7d67c1103c76288257f6c2bf904b81c78c35'};
const FLAG_ENC = "6022082a4032551a433c9e37760804de5bf0e95c654fdd5ad925559eb8e2cd5c5b";
const enc = new TextEncoder();
const $ = id => document.getElementById(id);
const card = $('card'), msg = $('msg'), tries = $('tries');
let fails = 0;

try { localStorage.setItem('keycard', (412).toString(2)); } catch (e) {}

async function sha(s) { return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
const hex = u => [...u].map(x => x.toString(16).padStart(2, '0')).join('');
async function check(stage, val) {
  return hex(await sha('meridian:' + stage + ':' + val.trim().toLowerCase())) === H[stage];
}

function lock(form) {
  const btn = form.querySelector('button');
  let s = 15; btn.disabled = true;
  const t = setInterval(() => {
    msg.textContent = 'Too many attempts. Try again in ' + s + 's.';
    if (--s < 0) { clearInterval(t); btn.disabled = false; msg.textContent = ''; fails = 0; tries.textContent = ''; }
  }, 1000);
}
function fail(form, text) {
  fails++;
  msg.textContent = text;
  tries.textContent = 'Failed attempts: ' + fails + ' / 5';
  card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  if (fails >= 5) lock(form);
}
function advance(from, to, bar) {
  $(from).hidden = true; $(to).hidden = false; msg.textContent = '';
  $(bar).classList.add('on'); $(to).querySelector('input').focus();
}

$('f1').addEventListener('submit', async e => {
  e.preventDefault();
  const ok = (await check('u', $('u').value)) && (await check('p', $('p').value));
  ok ? advance('f1', 'f2', 's2') : fail($('f1'), 'Access denied.');
});
$('f2').addEventListener('submit', async e => {
  e.preventDefault();
  (await check('c', $('c').value)) ? advance('f2', 'f3', 's3') : fail($('f2'), 'Code rejected.');
});
$('f3').addEventListener('submit', async e => {
  e.preventDefault();
  const v = $('m').value;
  if (!(await check('m', v))) return fail($('f3'), 'Master key rejected.');
  const key = await sha('meridian:k:' + v.trim().toLowerCase());
  const bytes = FLAG_ENC.match(/../g).map((h, i) => parseInt(h, 16) ^ key[i % 32]);
  $('flag').textContent = String.fromCharCode(...bytes);
  $('f3').hidden = true; $('done').hidden = false; msg.textContent = ''; tries.textContent = '';
});
