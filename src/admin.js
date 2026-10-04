import './admin.css'
import { auth, db } from './firebase.js'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'

const CATS = ['Photo', 'Video', 'Drone', 'Digital', 'Advertising', 'Other']
const app = document.getElementById('app')
let user = null
let projects = []

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const safeUrl = (u) => (/^https?:\/\/|^\//.test(u || '') ? u : '')
const toast = (msg) => {
  const t = document.getElementById('toast')
  t.textContent = msg; t.classList.add('on')
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600)
}

async function load() {
  const snap = await getDocs(collection(db, 'portfolio'))
  projects = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function loginView(error = '') {
  app.innerHTML = `<div class="login"><form id="lf">
    <div class="logo">FRAME AMMO<span>CREATIVE STUDIO</span></div>
    <h1>Вход</h1>
    <div><label>Email</label><input type="email" name="email" autocomplete="username" required /></div>
    <div><label>Пароль</label><input type="password" name="password" autocomplete="current-password" required /></div>
    <p class="err">${esc(error)}</p>
    <button class="btn solid" type="submit">Войти</button></form></div>`
  document.getElementById('lf').onsubmit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    e.target.querySelector('button').disabled = true
    try { await signInWithEmailAndPassword(auth, f.get('email'), f.get('password')) }
    catch (error) {
  console.error('FIREBASE LOGIN ERROR:', error)
  loginView(error.code + ' — ' + error.message)
}
  }
}

function shell(title, sub, content, route, extra = '') {
  const a = (h, t) => `<a href="#${h}" class="${route === h ? 'active' : ''}">${t}</a>`
  app.innerHTML = `<div class="admin">
    <aside class="sidebar">
      <a class="logo" href="#/">FRAME AMMO<span>CREATIVE STUDIO</span></a>
      <nav class="nav">${a('/', 'Dashboard')}${a('/portfolio', 'Portfolio')}${a('/add-project', 'Добавить проект')}${a('/settings', 'Настройки')}</nav>
    </aside>
    <main class="main">
      <div class="top"><div><h1>${title}</h1><p>${sub}</p></div>
        <div>${extra}<button class="logout" id="lo">Выйти</button></div></div>
      ${content}
    </main></div>`
  document.getElementById('lo').onclick = () => signOut(auth)
}

const card = (p) => `<article class="pcard">
  ${safeUrl(p.image) ? `<img src="${esc(p.image)}" alt="" loading="lazy" />` : '<div class="noimg"></div>'}
  <div class="pbody"><span class="tag">${esc(p.category)} · ${esc(p.year)}</span><h3>${esc(p.title)}</h3>
  <span class="tag ${p.active ? '' : 'off'}">${p.active ? 'Активен' : 'Скрыт'} · № ${esc(p.order)}</span></div>
  <div class="acts"><a class="btn" href="#/edit/${p.id}">Редактировать</a><button class="btn danger" data-del="${p.id}">Удалить</button></div></article>`

const listHtml = () => projects.length
  ? `<div class="list">${projects.map(card).join('')}</div>`
  : '<div class="empty">Пока нет добавленных проектов.</div>'

function bindDelete() {
  document.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => confirmDelete(b.dataset.del)))
}
function confirmDelete(id) {
  const m = document.createElement('div'); m.className = 'modal'
  m.innerHTML = `<div class="box"><p>Удалить этот проект?</p><div class="row"><button class="btn" id="no">Отмена</button><button class="btn danger" id="yes">Удалить</button></div></div>`
  document.body.append(m)
  m.querySelector('#no').onclick = () => m.remove()
  m.querySelector('#yes').onclick = async () => {
    try { await deleteDoc(doc(db, 'portfolio', id)); await load(); toast('Проект удалён') }
    catch { toast('Не удалось удалить. Проверьте права доступа.') }
    m.remove(); render()
  }
}

function dashboard() {
  shell('Dashboard', 'Управление FRAME AMMO', `
    <div class="stats">
      <div class="card"><small>Проекты</small><div class="number">${projects.length}</div></div>
      <div class="card"><small>Услуги</small><div class="number">5</div></div>
      <div class="card"><small>Статус</small><div class="number">OK</div></div>
    </div>
    <section class="section"><h2>Portfolio</h2>${listHtml()}</section>`, '/')
  bindDelete()
}

function portfolioView() {
  shell('Portfolio', 'Все проекты', `<section>${listHtml()}</section>`, '/portfolio',
    '<a class="btn solid" href="#/add-project" style="margin-right:10px">Добавить проект</a>')
  bindDelete()
}

function formView(p) {
  const edit = !!p
  const v = p || { title: '', category: 'Photo', description: '', year: String(new Date().getFullYear()), image: '', link: '', order: projects.length + 1, active: true }
  shell(edit ? 'Редактирование' : 'Добавить проект', edit ? esc(v.title) : 'Новый проект в Portfolio', `
  <form class="form" id="pf">
    <div class="full"><label>Название проекта</label><input name="title" required value="${esc(v.title)}" /></div>
    <div><label>Категория</label><select name="category">${CATS.map((c) => `<option ${c === v.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div><label>Год</label><input name="year" value="${esc(v.year)}" /></div>
    <div class="full"><label>Описание</label><textarea name="description">${esc(v.description)}</textarea></div>
    <div class="full"><label>URL изображения</label><input name="image" placeholder="https://… или /images/photo.jpg" value="${esc(v.image)}" /></div>
    <div><label>URL проекта</label><input name="link" value="${esc(v.link)}" /></div>
    <div><label>Порядок</label><input name="order" type="number" value="${esc(v.order)}" /></div>
    <div class="full check"><input type="checkbox" id="act" name="active" ${v.active ? 'checked' : ''} /><label for="act">Активен (показывать на сайте)</label></div>
    <div class="full"><button class="btn solid" type="submit">${edit ? 'Сохранить изменения' : 'Добавить проект'}</button></div>
  </form>`, edit ? '/portfolio' : '/add-project')
  document.getElementById('pf').onsubmit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const data = {
      title: f.get('title').trim(), category: f.get('category'), description: f.get('description').trim(),
      year: f.get('year').trim(), image: f.get('image').trim(), link: f.get('link').trim(),
      order: Number(f.get('order')) || 0, active: f.get('active') === 'on', updatedAt: serverTimestamp(),
    }
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true
    try {
      if (edit) { await updateDoc(doc(db, 'portfolio', p.id), data); await load(); toast('Изменения сохранены'); location.hash = '#/portfolio' }
      else { await addDoc(collection(db, 'portfolio'), { ...data, createdAt: serverTimestamp() }); await load(); toast('Проект добавлен'); formView() }
    } catch { toast('Ошибка сохранения. Проверьте права доступа.'); btn.disabled = false }
  }
}

function settingsView() {
  shell('Настройки', 'Аккаунт', `<div class="stats"><div class="card"><small>Email</small><div style="margin-top:20px">${esc(user.email)}</div></div>
    <div class="card"><small>Роль</small><div style="margin-top:20px">owner</div></div></div>`, '/settings')
}

function render() {
  if (!user) return
  const h = location.hash.replace(/^#/, '') || '/'
  const m = h.match(/^\/edit\/(.+)$/)
  if (m) { const p = projects.find((x) => x.id === m[1]); return p ? formView(p) : (location.hash = '#/portfolio') }
  if (h === '/portfolio') return portfolioView()
  if (h === '/add-project') return formView()
  if (h === '/settings') return settingsView()
  dashboard()
}
window.addEventListener('hashchange', render)

onAuthStateChanged(auth, async (u) => {
  if (!u) { user = null; return loginView() }
  try {
    const role = (await getDoc(doc(db, 'users', u.uid))).data()?.role
    if (role !== 'owner') { await signOut(auth); return loginView('Нет доступа: нужна роль owner.') }
    user = u
    await load()
    render()
  } catch { await signOut(auth); loginView('Не удалось проверить доступ.') }
})
