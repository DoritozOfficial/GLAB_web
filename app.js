(() => {
  'use strict';
  const pages = new Set(['home', 'socials', 'maps', 'spawn', 'updates', 'sneak-peeks']);
  const titles = {socials:'Socials', maps:'Maps', spawn:'Spawn',updates:'Updates','sneak-peeks':'Sneak Peeks'};
  const items = (window.GLAB_CATALOG?.items || []).filter(item => item.id && item.name);
  const metaUrl = 'https://www.meta.com/experiences/gorillas-lab/9945172845577818/';
  const pageSize = 12;
  const colors = {ALL:'#70e8b5',RECENT:'#70e8b5',FAVORITES:'#ffd47c',PROPS:'#64cfff',TOOLS:'#ffd47c',VEHICLES:'#69ebb3',WEAPONS:'#ff929d',EXPLOSIVE:'#ffa76d',CARDBOARD:'#dcb789',SHAPES:'#b89bff',MECH:'#67dfe8',MODS:'#ff95d9'};
  const $ = selector => document.querySelector(selector);
  function readKeys(key) { try { const value=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(value)?value.filter(v=>typeof v==='string'):[]; } catch {return [];} }
  function saveKeys(key,values) { try {localStorage.setItem(key,JSON.stringify(values));} catch { /* Browsing works even when storage is unavailable. */ } }
  let favorites=new Set(readKeys('glab.web.favorites.v1'));
  let recent=readKeys('glab.web.recent.v1');
  let selected=null, category='ALL', page=0, query='';
  const categoryNames=['ALL','RECENT','FAVORITES',...new Set(items.flatMap(i=>i.categories||[]).filter(Boolean).filter(c=>!['ALL','RECENT','FAVORITES','MODS'].includes(c.toUpperCase())))];
  if(items.some(i=>!i.categories?.length)) categoryNames.push('MODS');
  const tint = value => colors[value.toUpperCase()] || '#70e8b5';
  const itemTint = item => tint(item.categories?.[0]||'MODS');
  function showPage() {
    const requested=location.hash.slice(1).toLowerCase();
    const current=pages.has(requested)?requested:'home';
    document.querySelectorAll('.page').forEach(el=>{el.hidden=el.id!==current;});
    document.querySelectorAll('[data-page]').forEach(link=>{
      if(link.dataset.page===current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    });
    requestAnimationFrame(()=>{document.querySelector('.terminal').scrollTop=0;window.scrollTo({top:0,left:0,behavior:'instant'});});
    document.title=titles[current]?`${titles[current]} | Gorillas Lab`:'Gorillas Lab';
  }
  function filteredItems() {
    const term=query.trim().toLowerCase();
    let result=items.filter(item=>{
      let match=category==='ALL' || (category==='FAVORITES'?favorites.has(item.id):category==='RECENT'?recent.includes(item.id):category==='MODS'?!item.categories?.length:(item.categories||[]).some(c=>c.toLowerCase()===category.toLowerCase()));
      return match && (!term || [item.name,item.description,...(item.categories||[])].join(' ').toLowerCase().includes(term));
    });
    if(category==='RECENT')result=result.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
    return result;
  }
  function renderCategories() {
    const strip=$('.spawn-categories'); strip.replaceChildren();
    categoryNames.forEach(name=>{
      const button=document.createElement('button');button.type='button';button.className='spawn-category';button.textContent=name.toUpperCase();button.setAttribute('aria-pressed',String(category===name));button.style.setProperty('--category-color',tint(name));
      if(name==='RECENT')button.title='Recently viewed items on this website';
      button.addEventListener('click',()=>{category=name;page=0;renderCategories();renderGrid();});strip.append(button);
    });
  }
  function itemImage(item) {
    if(!item.image || !/^assets\/items\/[a-f0-9]+\.png$/.test(item.image))return null;
    const img=document.createElement('img');img.src=item.image;img.alt='';img.loading='lazy';img.width=256;img.height=256;return img;
  }
  function renderGrid() {
    const result=filteredItems();const pages=Math.max(1,Math.ceil(result.length/pageSize));page=Math.max(0,Math.min(page,pages-1));
    const grid=$('.item-grid');grid.replaceChildren();
    $('#item-count').textContent=`${result.length} ${result.length===1?'item':'items'}`;
    $('#item-page').textContent=`${String(page+1).padStart(2,'0')} / ${String(pages).padStart(2,'0')}`;
    $('#item-prev').disabled=page===0;$('#item-next').disabled=page+1>=pages;
    if(!result.length){const empty=document.createElement('div');empty.className='catalog-empty';empty.textContent=category==='FAVORITES'?'No favorites yet. Star an item to save it here.':category==='RECENT'?'No recently viewed items. Select an item to start.':'No items found. Try another search or category.';grid.append(empty);return;}
    result.slice(page*pageSize,(page+1)*pageSize).forEach((item,index)=>{
      const card=document.createElement('div');card.className='item-card';card.style.setProperty('--tile-color',itemTint(item));
      const button=document.createElement('button');button.className='item-select';button.type='button';button.setAttribute('aria-pressed',String(selected?.id===item.id));button.setAttribute('aria-label',`Select ${item.name}`);
      const image=itemImage(item);if(image)button.append(image);
      const number=document.createElement('span');number.className='item-index';number.textContent=String(page*pageSize+index+1).padStart(2,'0');number.setAttribute('aria-hidden','true');button.append(number);
      const name=document.createElement('span');name.className='item-name';name.textContent=item.name;button.append(name);
      button.addEventListener('click',()=>{selected=item;recent=[item.id,...recent.filter(id=>id!==item.id)].slice(0,24);saveKeys('glab.web.recent.v1',recent);renderDetail();renderGrid();$('#catalog-status').textContent=`${item.name} selected`;});
      const star=document.createElement('button');star.type='button';star.className='favorite-button';star.setAttribute('aria-label',`${favorites.has(item.id)?'Unfavorite':'Favorite'} ${item.name}`);star.setAttribute('aria-pressed',String(favorites.has(item.id)));
      star.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.3 7 .9-5.1 4.8 1.3 7-6.2-3.4L5.8 21l1.3-7L2 9.2l7-.9Z"/></svg>';
      star.addEventListener('click',()=>{if(favorites.has(item.id))favorites.delete(item.id);else favorites.add(item.id);saveKeys('glab.web.favorites.v1',[...favorites]);renderGrid();$('#catalog-status').textContent=favorites.has(item.id)?`${item.name} favorited`:`${item.name} removed from favorites`;});
      card.append(button,star);grid.append(card);
    });
  }
  function renderDetail() {
    $('#detail-image').replaceChildren();
    $('#spawn-action').setAttribute('aria-disabled',String(!selected));$('#clear-selection').disabled=!selected;
    if(!selected){$('#detail-name').textContent='Choose an item';$('#detail-category').textContent='';$('#detail-description').textContent='Select an item to preview it.';return;}
    const image=itemImage(selected);if(image){image.loading='eager';$('#detail-image').append(image);}
    $('.spawn-terminal').style.setProperty('--item-accent',itemTint(selected));
    $('#detail-name').textContent=selected.name;
    $('#detail-category').textContent=selected.categories?.length?selected.categories.join(' + '):'Mod';
    $('#detail-description').textContent=selected.description||'Choose SPAWN to open Gorillas Lab on Meta and try this item in the game.';
    $('#spawn-action').setAttribute('aria-label',`Spawn ${selected.name} — opens Gorillas Lab on Meta in a new tab`);
  }
  $('.how-toggle').addEventListener('click',()=>{const help=$('#spawn-help');help.hidden=!help.hidden;$('.how-toggle').setAttribute('aria-expanded',String(!help.hidden));});
  $('#item-search').addEventListener('input',event=>{query=event.target.value;page=0;renderGrid();});
  $('#search-clear').addEventListener('click',()=>{$('#item-search').value='';query='';page=0;renderGrid();$('#item-search').focus();});
  $('#item-prev').addEventListener('click',()=>{page--;renderGrid();});$('#item-next').addEventListener('click',()=>{page++;renderGrid();});
  $('#category-prev').addEventListener('click',()=>$('.spawn-categories').scrollBy({left:-260,behavior:'smooth'}));
  $('#category-next').addEventListener('click',()=>$('.spawn-categories').scrollBy({left:260,behavior:'smooth'}));
  $('#clear-selection').addEventListener('click',()=>{selected=null;renderDetail();renderGrid();$('#catalog-status').textContent='Selection cleared';});
  $('#spawn-action').href=metaUrl;
  $('#spawn-action').addEventListener('click',event=>{if(!selected){event.preventDefault();return;}$('#catalog-status').textContent='Opening Gorillas Lab on Meta…';});
  window.addEventListener('hashchange',showPage);
  document.querySelectorAll('a[href^="#"]').forEach(link=>{if(link.classList.contains('skip-link'))return;link.addEventListener('click',()=>requestAnimationFrame(()=>$('#page-content').focus({preventScroll:true})));});
  renderCategories();renderGrid();renderDetail();showPage();
})();


