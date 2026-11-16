export function h(tag, cls, text, children) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined && text !== null && text !== '') el.textContent = text;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      if (children[i]) el.appendChild(children[i]);
    }
  }
  return el;
}

export function btn(cls, text, onClick, type = 'button') {
  const b = h('button', cls, text);
  b.type = type;
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

