/* Samadhan Complaint Desk – all logic in one file */
const ADMIN_PASS = 'admin123';            // CHANGE THIS
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const NAV = [['index.html','Home'],['about.html','About'],['submit.html','File a complaint'],['track.html','Track status'],['contact.html','Contact']];
const page = document.body.dataset.page;
const $ = id => document.getElementById(id);

/* ---------- storage ---------- */
const db = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)) || (k === 'cms_messages' ? [] : {}); } catch (e) { return k === 'cms_messages' ? [] : {}; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const badge = s => `<span class="badge bg-${{Pending:'warning text-dark','In Progress':'info text-dark',Resolved:'success',Rejected:'danger'}[s] || 'secondary'}">${esc(s)}</span>`;

/* ---------- common navbar + footer ---------- */
$('site-header').innerHTML = `
<nav class="navbar navbar-expand-lg site-nav sticky-top"><div class="container">
 <a class="navbar-brand" href="index.html"><span class="logo-mark">S</span>Samadhan</a>
 <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu" aria-label="Menu"><span class="navbar-toggler-icon"></span></button>
 <div class="collapse navbar-collapse" id="menu"><ul class="navbar-nav ms-auto gap-lg-2">
  ${NAV.map(([f, l]) => `<li class="nav-item"><a class="nav-link ${f.startsWith(page) ? 'active' : ''}" href="${f}">${l}</a></li>`).join('')}
 </ul></div></div></nav>`;
$('site-footer').innerHTML = `
<footer class="site-footer"><div class="container"><div class="row g-4">
 <div class="col-md-5"><h5>Samadhan Complaint Desk</h5><p>One place to report a problem, get a reference ID and follow it until it is resolved.</p></div>
 <div class="col-6 col-md-3"><h6>Pages</h6><ul class="list-unstyled">${NAV.slice(0, 4).map(([f, l]) => `<li><a href="${f}">${l}</a></li>`).join('')}</ul></div>
 <div class="col-6 col-md-4"><h6>Help desk</h6><p class="mb-1">help@samadhan.example</p><p class="mb-1">Mon–Sat, 10 am – 5 pm</p><a href="admin.html">Staff login</a></div>
</div><hr><p class="small mb-0">&copy; ${new Date().getFullYear()} Samadhan. Mini project – Web Hosting &amp; FTP.</p></div></footer>`;

/* ---------- validation helper ---------- */
function validate(form, onValid) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.classList.add('was-validated');
    if (form.checkValidity()) onValid();
  });
}

/* ---------- pages ---------- */
if (page === 'index') {
  const all = Object.values(db.get('cms_complaints'));
  const done = all.filter(c => c.status === 'Resolved').length;
  $('sTotal').textContent = all.length; $('sDone').textContent = done; $('sOpen').textContent = all.length - done;
}

if (page === 'submit') {
  const cat = new URLSearchParams(location.search).get('cat');
  if (cat) $('category').value = cat;
  $('phone').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 10); });
  $('details').addEventListener('input', function () { $('count').textContent = this.value.length; });
  validate($('complaintForm'), () => {
    const all = db.get('cms_complaints'); let id;
    do { id = 'CMS' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + (1000 + Math.floor(Math.random() * 9000)); } while (all[id]);
    all[id] = { name: $('name').value.trim(), phone: $('phone').value, email: $('email').value.trim(), category: $('category').value,
      subject: $('subject').value.trim(), details: $('details').value.trim(), status: 'Pending', remark: '', date: new Date().toLocaleString('en-IN') };
    db.set('cms_complaints', all);
    $('complaintForm').classList.add('d-none'); $('done').classList.remove('d-none');
    $('newId').textContent = id; $('trackLink').href = 'track.html?id=' + id;
    scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (page === 'track') {
  const show = id => {
    const c = db.get('cms_complaints')[id], out = $('result');
    if (!c) { out.innerHTML = `<div class="alert alert-warning">No complaint found for <strong>${esc(id)}</strong> in this browser. Check the ID and try again.</div>`; return; }
    const steps = ['Pending', 'In Progress', 'Resolved'], idx = steps.indexOf(c.status);
    out.innerHTML = `<div class="form-card">
     <div class="d-flex justify-content-between flex-wrap gap-2"><h4 class="mb-0">${esc(c.subject)}</h4>${badge(c.status)}</div>
     <p class="text-muted mt-1">${esc(id)} · ${esc(c.category)} · filed ${esc(c.date)}</p>
     ${idx >= 0 ? `<ol class="steps big">${steps.map((s, i) => `<li class="${i <= idx ? 'on' : ''}">${s}</li>`).join('')}</ol>` : ''}
     <p>${esc(c.details).replace(/\n/g, '<br>')}</p>
     <div class="remark"><strong>Remark from staff:</strong> ${c.remark ? esc(c.remark) : 'No remark yet.'}</div></div>`;
  };
  validate($('trackForm'), () => show($('id').value.trim().toUpperCase()));
  const q = new URLSearchParams(location.search).get('id');
  if (q) { $('id').value = q; show(q.toUpperCase()); }
}

if (page === 'contact') {
  validate($('contactForm'), () => {
    const m = db.get('cms_messages');
    m.push({ name: $('cname').value.trim(), email: $('cemail').value.trim(), message: $('cmsg').value.trim(), date: new Date().toLocaleString('en-IN') });
    db.set('cms_messages', m);
    $('contactForm').reset(); $('contactForm').classList.remove('was-validated'); $('sent').classList.remove('d-none');
  });
}

if (page === 'admin') {
  const render = () => {
    const all = db.get('cms_complaints'), ids = Object.keys(all).reverse();
    $('login').classList.add('d-none'); $('panel').classList.remove('d-none');
    $('panelCount').textContent = ids.length + ' complaints';
    $('list').innerHTML = ids.length ? ids.map(id => { const c = all[id]; return `
     <div class="form-card mb-3" data-id="${id}">
      <div class="d-flex justify-content-between flex-wrap"><strong>${esc(id)} · ${esc(c.subject)}</strong>${badge(c.status)}</div>
      <p class="small text-muted mb-2">${esc(c.name)} · ${esc(c.phone)} · ${esc(c.email)} · ${esc(c.category)} · ${esc(c.date)}</p>
      <p>${esc(c.details)}</p>
      <div class="row g-2">
       <div class="col-md-3"><select class="form-select st">${STATUSES.map(s => `<option ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
       <div class="col-md-7"><input class="form-control rm" placeholder="Remark for the citizen" value="${esc(c.remark)}"></div>
       <div class="col-md-2"><button class="btn btn-accent w-100 up">Update</button></div>
      </div></div>`; }).join('') : '<p>No complaints yet.</p>';
  };
  if (sessionStorage.getItem('cms_admin')) render();
  validate($('loginForm'), () => {
    if ($('pass').value === ADMIN_PASS) { sessionStorage.setItem('cms_admin', '1'); render(); } else $('loginErr').classList.remove('d-none');
  });
  $('logout').onclick = () => { sessionStorage.removeItem('cms_admin'); location.reload(); };
  $('list').addEventListener('click', e => {
    if (!e.target.classList.contains('up')) return;
    const box = e.target.closest('[data-id]'), all = db.get('cms_complaints');
    all[box.dataset.id].status = box.querySelector('.st').value;
    all[box.dataset.id].remark = box.querySelector('.rm').value.trim();
    db.set('cms_complaints', all); render();
  });
}
