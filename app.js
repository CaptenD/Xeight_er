/* ===== KONFIGURASI ===== */
const CFG={
  /* Pilih SALAH SATU cara menghubungkan Drive (lihat README):
     A) API      : URL Web App Apps Script (Code.gs)        -> paling aman, kunci tidak terlihat
     B) Langsung : FOLDER_ID + API_KEY (Google Drive API)   -> tanpa backend */
  API:"",
  FOLDER_ID:"",
  API_KEY:"",
  REFRESH_MIN:5,                      // cek perubahan folder otomatis setiap N menit
  NAME:"Pojok Baca",KELAS:"Kelas 8B, SMP Nusantara"
};
const DEMO=[
 {id:"DEMO-1",t:"Laskar Pelangi",a:"Andrea Hirata",cat:"Novel",kind:"ebook",type:"pdf",d:"Sepuluh anak Belitung berjuang agar sekolah mereka tetap berdiri."},
 {id:"DEMO-2",t:"Bumi Manusia",a:"Pramoedya Ananta Toer",cat:"Novel",kind:"ebook",type:"pdf",d:"Kisah Minke di masa kolonial tentang cinta, keadilan, dan harga diri."},
 {id:"DEMO-3",t:"Atomic Habits",a:"James Clear",cat:"Pengembangan Diri",kind:"ebook",type:"pdf",d:"Perubahan kecil yang konsisten membentuk kebiasaan besar."},
 {id:"DEMO-4",t:"Kosmos",a:"Carl Sagan",cat:"Sains",kind:"ebook",type:"pdf",d:"Perjalanan memahami alam semesta dengan rasa takjub."},
 {id:"DEMO-5",t:"Antologi Puisi Hujan",a:"Siswa Kelas 8B",cat:"Puisi",kind:"karya",type:"doc",d:"Kumpulan puisi karya siswa tentang hujan dan kenangan."},
 {id:"DEMO-6",t:"Cerpen: Jam Dinding",a:"Nisa Putri",cat:"Cerpen",kind:"karya",type:"doc",d:"Sebuah jam dinding kelas yang selalu terlambat satu jam."},
 {id:"DEMO-7",t:"Poster Hari Buku",a:"Tim Mading",cat:"Desain",kind:"karya",type:"image",d:"Kumpulan poster kampanye literasi buatan siswa."},
 {id:"DEMO-8",t:"Presentasi Tata Surya",a:"Kelompok 3",cat:"Sains",kind:"karya",type:"slide",d:"Presentasi proyek IPA tentang planet dan orbitnya."}
];
/* ======================== */

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const IC={book:"M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19a2 2 0 012-2h13",bm:"M7 3h10v18l-5-3.5L7 21z",search:"M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4",back:"M15 18l-6-6 6-6",info:"M12 3a9 9 0 100 18 9 9 0 000-18zM12 8h.01M11 12h1v5h1",full:"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",down:"M12 4v12m-5-5l5 5 5-5M5 20h14",ext:"M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",x:"M6 6l12 12M18 6L6 18",next:"M9 6l6 6-6 6",refresh:"M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",grid:"M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",list:"M4 6h16M4 12h16M4 18h16"};
const ico=n=>`<svg class="i" viewBox="0 0 24 24"><path d="${IC[n]}"/></svg>`;
$$("[data-ic]").forEach(e=>e.insertAdjacentHTML("afterbegin",ico(e.dataset.ic)));
$("#nm").textContent=CFG.NAME;$("#kl").textContent="© "+CFG.NAME;$("#kl2").textContent=CFG.KELAS;

const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let ITEMS=[],saved=new Set(store.get("pbk-saved",[])),recent=store.get("pbk-recent",[]);
const SAVEX=store.get("pbk-savex",{});
let tab="kelas";const ox={src:"Semua sumber",lang:"all",q:"",page:1,res:[],more:false,err:"",tk:0};
const byId=id=>ITEMS.find(i=>i.id===id)||ox.res.find(i=>i.id===id)||SAVEX[id]||recent.find(i=>i.id===id);
let kind="Semua",cat="Semua",fmt="Semua",view="grid",sort="new",term="",onlySaved=false,ready=false,routed=false,custom=false,syncAt=0;

const TYPE={web:"Baca online",pdf:"PDF",docx:"DOCX",doc:"Google Docs",pptx:"PPTX",slide:"Google Slides",xlsx:"XLSX",sheet:"Google Sheets",video:"Video",image:"Gambar"};
const fmtSize=b=>!b?"":b>1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";
const fmtDate=d=>{try{return new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}catch{return""}};
const isNew=i=>i.date&&Date.now()-new Date(i.date)<7*864e5;
const SRC={doc:i=>`https://docs.google.com/document/d/${i}/preview`,slide:i=>`https://docs.google.com/presentation/d/${i}/embed`,sheet:i=>`https://docs.google.com/spreadsheets/d/${i}/preview`};
const src=it=>it.url||(SRC[it.type]||(i=>`https://drive.google.com/file/d/${i}/preview`))(it.id);
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
const isDemo=id=>/^DEMO/.test(id);
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("on"),3200)}

function parseDrive(v){
  const m=String(v).match(/(?:\/d\/|[?&]id=)([\w-]{15,})/);if(!m||!/google\.com/.test(v))return null;
  const type=/\/document\//.test(v)?"doc":/\/presentation\//.test(v)?"slide":/\/spreadsheets\//.test(v)?"sheet":"pdf";
  return{id:m[1],t:"Dokumen Google Drive",a:"Tautan langsung",cat:"Tautan",kind:"ebook",type,d:"Dibuka dari tautan Google Drive yang kamu tempel."};
}
const parseFolder=v=>{const m=String(v).match(/folders\/([\w-]{15,})/);return m&&/google\.com/.test(v)?m[1]:null};
const TH={};
const cover=(it,cls="")=>{const h=hue(it.id),s=TH[it.id]||it.th||(it.ext?"":`https://drive.google.com/thumbnail?id=${it.id}&sz=w480`);
  return `<div class="cover ${cls}" style="--a:hsl(${h} 55% 40%);--b:hsl(${(h+50)%360} 60% 20%)"><b>${esc(it.t[0])}</b><span class="ft">${TYPE[it.type]||"File"}</span>${isDemo(it.id)||!s?"":`<img loading="lazy" referrerpolicy="no-referrer" alt="" data-x="${it.ext?1:0}" data-id="${esc(it.id)}" data-th="${it.th?1:0}" src="${esc(s)}" onload="this.classList.add('ok')" onerror="thumbFail(this)">`}</div>`};
/* rantai thumbnail: thumbnailLink API -> endpoint thumbnail Drive -> thumbnail dari backend (base64) -> sampul gradien */
async function thumbFail(img){
  if(img.dataset.x==="1"){img.remove();return}
  const n=(+img.dataset.s||0)+1;img.dataset.s=n;const id=img.dataset.id;
  if(img.dataset.th==="1"&&n===1){img.src=`https://drive.google.com/thumbnail?id=${id}&sz=w480`;return}
  if(CFG.API&&!img.dataset.b){img.dataset.b=1;
    try{const j=await(await fetch(CFG.API+(CFG.API.includes("?")?"&":"?")+"thumb="+encodeURIComponent(id))).json();if(j.data){TH[id]=j.data;img.src=j.data;return}}catch{}}
  img.remove();
}

/* ---- segmented pill ---- */
function seg(el,opts,cur,fn){
  el.innerHTML='<span class="pl"></span>'+opts.map(o=>`<button>${esc(o)}</button>`).join("");
  const mv=()=>{const on=[...el.querySelectorAll("button")].find(b=>b.textContent===cur);if(!on)return;
    el.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b===on));const p=el.querySelector(".pl");p.style.width=on.offsetWidth+"px";p.style.transform=`translateX(${on.offsetLeft}px)`;el.scrollTo?.({left:on.offsetLeft-(el.clientWidth-on.offsetWidth)/2,behavior:"smooth"})};
  el.onclick=e=>{const b=e.target.closest("button");if(!b)return;cur=b.textContent;mv();fn(cur)};
  requestAnimationFrame(mv);el._mv=mv;el._set=v=>{cur=v;mv()};
}

/* ---- render ---- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.1});
$$(".rv").forEach(e=>io.observe(e));
function skeleton(){$("#grid").innerHTML=Array(8).fill('<div class="sk"></div>').join("")}
function list(){
  if(tab==="terbuka"&&!onlySaved)return ox.res;
  let l=(onlySaved?[...ITEMS,...Object.values(SAVEX)]:ITEMS).filter(i=>(kind==="Semua"||(kind==="E-book"?i.kind==="ebook":i.kind==="karya"))&&(cat==="Semua"||i.cat===cat)&&(fmt==="Semua"||i.type===fmt)&&(!onlySaved||saved.has(i.id))&&(i.t+" "+i.a+" "+i.cat+" "+(i.d||"")).toLowerCase().includes(term));
  return sort==="az"?l.sort((a,b)=>a.t.localeCompare(b.t,"id")):l.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
}
function render(vt){
  const go=()=>{
    const l=list();$("#cnt").textContent=l.length+(tab==="terbuka"&&!onlySaved?" hasil":" koleksi");$("#grid").classList.toggle("list",view==="list");
    $("#grid").innerHTML=l.length?l.map(i=>{const n=ITEMS.indexOf(i);return `<article class="card${ready?" in":""}"${n>=0&&n<60?` style="view-transition-name:c${n}"`:""} tabindex="0" role="button" data-id="${esc(i.id)}" aria-label="Baca ${esc(i.t)}">
      <button class="bm${saved.has(i.id)?" on":""}" aria-label="Simpan" aria-pressed="${saved.has(i.id)}">${ico("bm")}</button>${cover(i)}
      <h3>${esc(i.t)}</h3><small>${esc(i.a)}</small><div class="meta"><span class="tag">${i.ext?esc(i.src):(TYPE[i.type]||"File")}</span><span class="tag">${esc(i.cat)}</span>${isNew(i)?'<span class="tag nw">Baru</span>':""}</div></article>`}).join(""):
      `<p class="empty">${tab==="terbuka"&&!onlySaved?esc(ox.err||"Belum ada hasil. Coba kata kunci lain."):"Belum ada koleksi yang cocok. Ubah kata kunci, kategori, atau format."}${term&&tab==="kelas"?`<br><br><button class="pillb" id="toopen">Cari "${esc(term)}" di Perpustakaan Terbuka</button>`:""}</p>`;
    if(!ready)$$(".card").forEach((c,n)=>{c.style.transitionDelay=Math.min(n*55,420)+"ms";io.observe(c)});
    $("#svn").textContent=saved.size;
    const op=tab==="terbuka"&&!onlySaved;$("#more").hidden=!(op&&ox.more&&l.length);$("#mb").disabled=false;$("#mb").textContent="Muat lebih banyak";$("#onote").hidden=!op;
    if(op)$("#onote").textContent=(ox.err&&l.length?ox.err+" ":"")+"Sumber: Project Gutenberg, Internet Archive, dan Open Library. Hanya buku domain publik atau akses terbuka yang bisa dibaca online."};
  if(vt&&ready&&document.startViewTransition&&!reduce)document.startViewTransition(go);else go();
}
function build(){
  const cats=["Semua",...new Set(ITEMS.map(i=>i.cat))];if(!cats.includes(cat))cat="Semua";
  const fm=[...new Set(ITEMS.map(i=>i.type))];if(fmt!=="Semua"&&!fm.includes(fmt))fmt="Semua";
  $("#fmt").innerHTML='<option value="Semua">Semua format</option>'+fm.map(t=>`<option value="${t}"${t===fmt?" selected":""}>${TYPE[t]||t}</option>`).join("");
  seg($("#kind"),["Semua","E-book","Karya"],kind,v=>{kind=v;render(1)});
  seg($("#cats"),cats,cat,v=>{cat=v;render(1)});
  render();ready=true;renderRecent();
  if(!routed){routed=true;route(true)}
}
function renderRecent(){
  $("#rcw").hidden=!recent.length;
  $("#rc").innerHTML=recent.map(i=>`<button class="rc" data-id="${esc(i.id)}">${cover(i)}<span><strong>${esc(i.t)}</strong><small>${esc(i.a)}</small></span></button>`).join("");
}
$("#grid").addEventListener("pointermove",e=>{const c=e.target.closest(".card");if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty("--x",e.clientX-r.left+"px");c.style.setProperty("--y",e.clientY-r.top+"px")});
function pick(e){
  if(e.target.closest("#toopen")){const q=term;term="";$("#q").value="";setTab("terbuka",q);return}
  const b=e.target.closest(".bm");
  if(b){e.stopPropagation();const id=b.closest(".card").dataset.id;toggleSave(id);b.classList.toggle("on",saved.has(id));b.setAttribute("aria-pressed",saved.has(id));return}
  const c=e.target.closest("[data-id]");if(!c)return;
  const it=byId(c.dataset.id);if(it)openReader(it,c);
}
["#grid","#rc"].forEach(s=>$(s).addEventListener("click",pick));
$("#grid").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList.contains("card"))pick(e)});
function toggleSave(id){const it0=byId(id);saved.has(id)?saved.delete(id):saved.add(id);if(it0&&it0.ext){saved.has(id)?SAVEX[id]=it0:delete SAVEX[id];store.set("pbk-savex",SAVEX)}store.set("pbk-saved",[...saved]);$("#svn").textContent=saved.size;if(cur&&cur.id===id)infoPanel();if(onlySaved)render()}
$("#sv").onclick=()=>{onlySaved=!onlySaved;if(onlySaved&&tab!=="kelas")setTab("kelas");$("#sv").classList.toggle("on",onlySaved);$("#sv").setAttribute("aria-pressed",onlySaved);render();$("#koleksi").scrollIntoView({behavior:"smooth"})};
$("#sort").onchange=e=>{sort=e.target.value;render(1)};
$("#fmt").onchange=e=>{fmt=e.target.value;render(1)};
$("#vw").onclick=e=>{const b=e.target.closest("button");if(!b)return;view=b.dataset.v;$$("#vw button").forEach(x=>x.classList.toggle("on",x===b));render(1)};
$("#sync").onclick=()=>{custom=false;if(SOURCE())sync(true,true);else{ITEMS=DEMO;build();status()}};

/* ---- pencarian pintar ---- */
$("#q").oninput=e=>{const v=e.target.value.trim(),f=parseFolder(v),d=parseDrive(v);
  $("#go").classList.toggle("show",!!(f||d));$("#go").textContent=f?"Muat folder":"Baca dari Drive";term=(f||d)?"":v.toLowerCase();if(term&&tab!=="kelas")setTab("kelas");else render()};
$("#q").onkeydown=e=>{if(e.key==="Enter")direct()};$("#go").onclick=direct;
function direct(){const v=$("#q").value.trim(),f=parseFolder(v),it=parseDrive(v);
  if(f)loadFolder(f);else if(it)openReader(it,$("#go"));else if(/^https?:/.test(v))toast("Tautan tidak dikenali. Tempel tautan file atau folder Google Drive.")}
addEventListener("keydown",e=>{if(e.key==="/"&&!/INPUT|SELECT/.test(document.activeElement.tagName)&&$("#reader").hidden){e.preventDefault();$("#q").focus()}
  if(!$("#reader").hidden){if(e.key==="Escape")closeReader();if(e.key==="i")$("#ri").click();if(e.key==="ArrowLeft")step(-1);if(e.key==="ArrowRight")step(1)}});

/* ---- pembaca ---- */
let cur=null,from=null,pushed=false;
function infoPanel(){
  const it=cur,rows=[["Sumber",it.src],["Format",TYPE[it.type]],["Ukuran",fmtSize(it.size)],["Diperbarui",it.date?fmtDate(it.date):""]].filter(r=>r[1]);
  $("#info").innerHTML=`${cover(it)}<span class="tag">${TYPE[it.type]||"File"} · ${esc(it.cat)}</span><h3>${esc(it.t)}</h3><small style="color:var(--mute)">${esc(it.a)}</small><p>${esc(it.d||"Belum ada deskripsi.")}</p>
  <dl class="dl">${rows.map(r=>`<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>
  <div class="acts"><button class="pillb ${saved.has(it.id)?"on":""}" id="isv">${ico("bm")}${saved.has(it.id)?"Tersimpan":"Simpan"}</button>
  <a class="pillb" target="_blank" rel="noopener" href="${it.ext?esc(it.link):"https://drive.google.com/open?id="+esc(it.id)}">${ico("ext")}${it.ext?"Buka di "+esc(it.src):"Buka di Google Drive"}</a></div>
  <div class="note">${it.ext?"Tidak tampil? Sebagian situs membatasi penyematan. Gunakan tombol Buka di "+esc(it.src)+".":"Tidak tampil? Pastikan akses file diatur ke \"Siapa saja yang memiliki link\" di Google Drive."}</div>`;
  $("#isv").onclick=()=>{toggleSave(it.id);const b=$(".card[data-id='"+CSS.escape(it.id)+"'] .bm");b&&b.classList.toggle("on",saved.has(it.id))};
}
function demoDoc(it){return `<body style="margin:0;font:18px/1.8 Georgia,serif;background:#fbf7ee;color:#2a2438"><div style="max-width:560px;margin:auto;padding:48px 28px"><h1 style="font-size:2rem">${esc(it.t)}</h1><p style="color:#7a7490">${esc(it.a)}</p><p>${esc(it.d)}</p><p><b>Ini tampilan contoh.</b> Setelah kamu mengisi katalog dengan file Google Drive asli, isi file akan tampil di sini dan bisa digulir langsung.</p></div></body>`}
function openReader(it,el,mode){
  cur=it;if(el)from=el;const R=$("#reader"),was=!R.hidden;
  $("#rt").textContent=it.t;$("#ra").textContent=it.a;$("#rd").href=it.dl||`https://drive.google.com/uc?export=download&id=${it.id}`;
  $("#rd").style.display=isDemo(it.id)?"none":"";infoPanel();
  $("#load").classList.remove("off");
  /* iframe baru tiap buka: mengganti src iframe lama menambah riwayat browser dan merusak tombol Back */
  const fr=document.createElement("iframe");fr.id="fr";fr.title="Isi dokumen";fr.allow="autoplay; fullscreen";fr.allowFullscreen=true;fr.onload=()=>$("#load").classList.add("off");
  if(isDemo(it.id))fr.srcdoc=demoDoc(it);else fr.src=src(it);
  $("#fr").replaceWith(fr);
  R.hidden=false;document.body.style.overflow="hidden";
  if(!was){$("#rm").classList.toggle("noinfo",innerWidth<=860);
    if(!reduce)R.animate([{opacity:0,transform:"translateY(1.5em)",filter:"blur(2px)"},{opacity:1,transform:"none",filter:"blur(0)"}],{duration:350,easing:"ease"})}
  else if(!reduce)$("#stage").animate([{opacity:.15,transform:"scale(.985)"},{opacity:1,transform:"none"}],{duration:450,easing:"cubic-bezier(.2,.8,.2,1)"});
  recent=[it,...recent.filter(r=>r.id!==it.id)].slice(0,8);store.set("pbk-recent",recent);renderRecent();
  if(mode==="swap"){try{history.replaceState(null,"","#/baca/"+it.id)}catch{}}
  else if(mode!=="first"&&!was){try{history.pushState(null,"","#/baca/"+it.id);pushed=true}catch{}}
  if(!was)$("#rcl").focus();
  const l=list(),ix=l.findIndex(x=>x.id===it.id);$("#rp").disabled=ix<=0;$("#rn").disabled=ix<0||ix>=l.length-1;
}
function step(d){if(!cur||$("#reader").hidden)return;const l=list(),ix=l.findIndex(x=>x.id===cur.id),n=l[ix+d];if(!n)return;
  from=document.querySelector(`.card[data-id="${CSS.escape(n.id)}"]`)||from;openReader(n,null,"swap")}
function closeVisual(){
  const R=$("#reader");if(R.hidden)return;
  const done=()=>{R.hidden=true;$("#fr").removeAttribute("src");$("#fr").removeAttribute("srcdoc");document.body.style.overflow="";if(document.fullscreenElement)document.exitFullscreen?.();from&&from.isConnected&&from.focus?.()};
  if(reduce)return done();
  R.animate([{opacity:1,transform:"none"},{opacity:0,transform:"translateY(1em)"}],{duration:300,easing:"ease"}).onfinish=done;
}
function closeReader(){if(pushed&&/^#\/baca\//.test(location.hash)){pushed=false;history.back();setTimeout(()=>{if(!$("#reader").hidden)closeVisual()},700)}else{closeVisual();try{history.replaceState(null,"",location.pathname+location.search)}catch{}}}
addEventListener("popstate",()=>{if(!/^#\/baca\//.test(location.hash))closeVisual()});
function route(first){
  const m=location.hash.match(/^#\/baca\/([\w.-]+)/);if(!m||!first)return;
  const it=byId(m[1]);if(it)openReader(it,null,"first");
}
$("#rcl").onclick=closeReader;$("#rp").onclick=()=>step(-1);$("#rn").onclick=()=>step(1);
$("#ri").onclick=()=>$("#rm").classList.toggle("noinfo");
$("#rf").onclick=()=>{const s=$("#stage");document.fullscreenElement?document.exitFullscreen():s.requestFullscreen?.().catch(()=>toast("Layar penuh tidak didukung di sini."))};

/* ---- Perpustakaan Terbuka: Project Gutenberg, Internet Archive, Open Library (gratis dan legal) ---- */
const getJ=async u=>{const r=await fetch(u);if(!r.ok)throw new Error("HTTP "+r.status);return r.json()};
const strip=v=>String(Array.isArray(v)?v[0]:v||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,300);
async function srcGB(q,page,lang){
  const j=await getJ(`https://gutendex.com/books/?page=${page}${q?"&search="+encodeURIComponent(q):""}${lang!=="all"?"&languages="+lang:""}`);
  return{more:!!j.next,items:j.results.map(b=>{const f=b.formats||{},h=Object.keys(f).find(k=>k.startsWith("text/html")),n=((b.authors[0]||{}).name||"Anonim").replace(/^([^,]+),\s*(.+)$/,"$2 $1");
    return{id:"gb-"+b.id,ext:1,src:"Project Gutenberg",t:b.title,a:n,cat:(b.subjects[0]||"Domain publik").split(" -- ")[0],kind:"ebook",type:"web",d:b.subjects.slice(0,3).join(" · "),
      th:f["image/jpeg"]||"",url:h?f[h]:`https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}-images.html`,dl:f["application/epub+zip"]||(h?f[h]:""),link:`https://www.gutenberg.org/ebooks/${b.id}`}})}}
async function srcIA(q,page,lang){
  const c=q.replace(/[()\[\]:"{}]/g," ").trim(),lq=lang==="id"?" AND language:(ind OR indonesian)":lang==="en"?" AND language:(eng OR english)":"";
  const qs=`${c?"("+c+") AND ":""}mediatype:texts AND NOT access-restricted-item:true${lq}`;
  const j=await getJ(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(qs)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=description&fl[]=year&rows=24&page=${page}&output=json${c?"":"&sort[]=downloads+desc"}`);
  const d=(j.response||{}).docs||[];
  return{more:d.length>=24,items:d.map(x=>({id:"ia-"+x.identifier,ext:1,src:"Internet Archive",t:strip(x.title)||x.identifier,a:strip(x.creator)||"Tanpa penulis",cat:x.year?"Terbit "+strip(x.year):"Teks terbuka",kind:"ebook",type:"web",d:strip(x.description),
    th:`https://archive.org/services/img/${x.identifier}`,url:`https://archive.org/embed/${x.identifier}`,dl:`https://archive.org/download/${x.identifier}`,link:`https://archive.org/details/${x.identifier}`}))}}
async function srcOL(q,page,lang){
  const qq=(q||"subject:literature")+(lang==="id"?" language:ind":lang==="en"?" language:eng":"");
  const j=await getJ(`https://openlibrary.org/search.json?q=${encodeURIComponent(qq)}&has_fulltext=true&limit=24&page=${page}&fields=key,title,author_name,cover_i,ia,first_publish_year,ebook_access,subject`);
  const d=j.docs||[];
  return{more:d.length>=24,items:d.filter(x=>x.ebook_access==="public"&&x.ia&&x.ia.length).map(x=>({id:"ol-"+x.key.split("/").pop(),ext:1,src:"Open Library",t:x.title,a:(x.author_name||["Tanpa penulis"])[0],
    cat:(x.subject&&x.subject[0])||(x.first_publish_year?"Terbit "+x.first_publish_year:"Buku terbuka"),kind:"ebook",type:"web",d:x.subject?x.subject.slice(0,4).join(" · "):"",
    th:x.cover_i?`https://covers.openlibrary.org/b/id/${x.cover_i}-M.jpg`:`https://archive.org/services/img/${x.ia[0]}`,url:`https://archive.org/embed/${x.ia[0]}`,dl:`https://archive.org/download/${x.ia[0]}`,link:`https://openlibrary.org${x.key}`}))}}
async function search(reset){
  const tk=++ox.tk;
  if(reset){ox.page=1;ox.res=[];ox.err="";ox.more=false;$("#more").hidden=true;$("#onote").hidden=true;skeleton()}
  $("#mb").disabled=true;$("#mb").textContent="Memuat...";
  const F={"Project Gutenberg":[srcGB],"Internet Archive":[srcIA],"Open Library":[srcOL],"Semua sumber":[srcGB,srcIA,srcOL]}[ox.src];
  const rs=await Promise.allSettled(F.map(f=>f(ox.q,ox.page,ox.lang)));if(tk!==ox.tk)return;
  const ok=rs.filter(r=>r.status==="fulfilled").map(r=>r.value),bad=rs.length-ok.length,seen=new Set(ox.res.map(i=>i.url)),max=Math.max(0,...ok.map(a=>a.items.length));
  for(let k=0;k<max;k++)ok.forEach(a=>{const i=a.items[k];if(i&&!seen.has(i.url)){seen.add(i.url);ox.res.push(i)}});
  ox.more=ok.some(a=>a.more);ox.page++;
  ox.err=!ok.length?"Tidak bisa terhubung ke sumber buku. Periksa koneksi internet. Di pratinjau Claude pencarian online diblokir, jadi buka dari hosting sendiri.":bad?bad+" sumber gagal dimuat, hasil dari sumber lain tetap ditampilkan.":"";
  render();
}
function setTab(t,q){
  tab=t;$("#tab")._set(t==="kelas"?"Koleksi kelas":"Perpustakaan terbuka");$("#tk").hidden=t!=="kelas";$("#to").hidden=t!=="terbuka";$("#setup").classList.toggle("hid",t==="terbuka");
  requestAnimationFrame(()=>{$("#osrc")._mv();$("#kind")._mv?.();$("#cats")._mv?.()});
  if(t==="terbuka"){if(q!=null){ox.q=q;$("#oq").value=q;search(true)}else if(!ox.res.length)search(true);else render(1);if(q!=null)$("#koleksi").scrollIntoView({behavior:"smooth"})}else render(1);
}
seg($("#tab"),["Koleksi kelas","Perpustakaan terbuka"],"Koleksi kelas",v=>setTab(v==="Koleksi kelas"?"kelas":"terbuka"));
seg($("#osrc"),["Semua sumber","Project Gutenberg","Internet Archive","Open Library"],"Semua sumber",v=>{ox.src=v;search(true)});
$("#olang").onchange=e=>{ox.lang=e.target.value;search(true)};
$("#of").onsubmit=e=>{e.preventDefault();ox.q=$("#oq").value.trim();search(true)};
$("#mb").onclick=()=>search(false);

/* ---- katalog: Apps Script ATAU Google Drive API langsung ---- */
const GAPI="https://www.googleapis.com/drive/v3/files";
const MT={"application/pdf":"pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx","application/msword":"docx","application/vnd.google-apps.document":"doc",
 "application/vnd.openxmlformats-officedocument.presentationml.presentation":"pptx","application/vnd.ms-powerpoint":"pptx","application/vnd.google-apps.presentation":"slide",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"xlsx","application/vnd.ms-excel":"xlsx","application/vnd.google-apps.spreadsheet":"sheet"};
const mtype=m=>MT[m]||(m.startsWith("video/")?"video":m.startsWith("image/")?"image":null);
const SOURCE=()=>CFG.API?"api":(CFG.FOLDER_ID&&CFG.API_KEY)?"drive":"";
async function scanFolder(id,cat="Umum",kd="ebook",depth=0,out=[]){
  const subs=[];let tok="";
  do{
    const u=`${GAPI}?q=${encodeURIComponent(`'${id}' in parents and trashed=false`)}&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=${encodeURIComponent("nextPageToken,files(id,name,mimeType,description,modifiedTime,size,thumbnailLink)")}&key=${CFG.API_KEY}${tok?"&pageToken="+tok:""}`;
    const r=await fetch(u),j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error?.message||"HTTP "+r.status);
    tok=j.nextPageToken||"";
    for(const f of j.files||[]){
      if(f.mimeType==="application/vnd.google-apps.folder"){if(depth<3)subs.push(f);continue}
      const type=mtype(f.mimeType);if(!type)continue;const p=(f.description||"").split("|");
      out.push({id:f.id,t:f.name.replace(/\.(pdf|docx?|pptx?|xlsx?|png|jpe?g|mp4)$/i,""),a:p[0].trim()||"Tanpa penulis",d:p.slice(1).join("|").trim(),cat,kind:kd,type,date:f.modifiedTime,size:+f.size||0,th:f.thumbnailLink?f.thumbnailLink.replace(/=s\d+$/,"=s480"):""});
    }
  }while(tok);
  await Promise.all(subs.map(x=>scanFolder(x.id,x.name,/^karya/i.test(x.name)?"karya":kd,depth+1,out)));
  return out;
}
async function fetchCatalog(force){
  if(CFG.API){const r=await fetch(CFG.API+(force?(CFG.API.includes("?")?"&":"?")+"refresh=1":"")),j=await r.json();if(j.error)throw new Error(j.error);return j.items||[]}
  return scanFolder(CFG.FOLDER_ID);
}
const sig=a=>a.map(i=>i.id+i.date).join("|");
function status(){$("#st").textContent=SOURCE()||custom?`${custom?"Folder dari tautan":"Terhubung ke Drive"} · ${new Date(syncAt||Date.now()).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}`:"Mode contoh"}
function showErr(e){const s=$("#setup");s.hidden=false;s.textContent=`Gagal membaca Drive (${e.message}). Pastikan folder dibagikan "Siapa saja yang memiliki link" dan konfigurasi di index.html sudah benar.`;
  if(!ITEMS.length){ITEMS=DEMO;build()}$("#st").textContent="Tidak terhubung"}
async function sync(force,manual){
  if(!SOURCE()||custom)return;$("#sync").classList.add("spin");
  try{const items=await fetchCatalog(force),had=ITEMS.length&&ITEMS!==DEMO;
    if(sig(items)!==sig(ITEMS)){ITEMS=items;build();if(had)toast("Koleksi diperbarui.")}else if(manual)toast("Katalog sudah terbaru.");
    store.set("pbk-cat2",{t:Date.now(),items});syncAt=Date.now();status();$("#setup").hidden=true}
  catch(e){showErr(e)}
  $("#sync").classList.remove("spin");
}
async function loadFolder(id){
  if(!CFG.API_KEY){toast("Membuka folder dari tautan membutuhkan API_KEY. Lihat README.");return}
  toast("Membaca folder...");
  try{const items=await scanFolder(id);if(!items.length){toast("Tidak ada PDF atau DOCX yang bisa dibaca di folder itu.");return}
    custom=true;ITEMS=items;cat="Semua";build();syncAt=Date.now();status();$("#koleksi").scrollIntoView({behavior:"smooth"})}
  catch(e){toast("Folder gagal dibaca: "+e.message)}
}
async function boot(){
  skeleton();
  if(!SOURCE()){ITEMS=DEMO;build();status();const s=$("#setup");s.hidden=false;s.textContent="Mode contoh. Isi CFG.API (Apps Script) atau CFG.FOLDER_ID + CFG.API_KEY di index.html agar folder Drive kamu terbaca otomatis. Lihat README.";return}
  const c=store.get("pbk-cat2",null);if(c&&c.items&&c.items.length){ITEMS=c.items;syncAt=c.t;build();status()}
  await sync(false,false);
  setInterval(()=>{if(!document.hidden)sync(false,false)},Math.max(1,CFG.REFRESH_MIN)*6e4);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-syncAt>CFG.REFRESH_MIN*6e4)sync(false,false)});
}
boot();addEventListener("resize",()=>{$("#kind")._mv?.();$("#cats")._mv?.()});

/* ---- menu, spotlight, dan form tautan ---- */
$("#mOpen").onclick=()=>setTab("terbuka");
$("#aOpen").onclick=()=>setTab("terbuka");
$("#mSaved").onclick=()=>{if(!onlySaved)$("#sv").click()};
$("#fd").onsubmit=e=>{e.preventDefault();const v=$("#fq").value.trim();if(!v)return;$("#q").value=v;$("#q").dispatchEvent(new Event("input"));direct()};
