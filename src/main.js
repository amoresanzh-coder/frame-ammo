import './style.css'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

// Sticky header state
const header = $('#header')
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40)
onScroll()
window.addEventListener('scroll', onScroll, { passive: true })

// Mobile menu
const burger = $('#burger')
const menu = $('#menu')
const setMenu = (open) => {
  burger.setAttribute('aria-expanded', open)
  menu.setAttribute('aria-hidden', !open)
  menu.classList.toggle('is-open', open)
  document.body.style.overflow = open ? 'hidden' : ''
}
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'))
$$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)))
window.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false))

// Reveal on scroll
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
  }),
  { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
)
$$('.reveal').forEach((el) => io.observe(el))

// Portfolio cursor
const cursor = $('#cursor')
if (cursor && matchMedia('(hover:hover)').matches) {
  window.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
  })
  $$('[data-cursor]').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-on'))
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-on'))
  })
}

import { loadPortfolio } from './portfolio.js'
loadPortfolio()
