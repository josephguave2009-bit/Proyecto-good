import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./social-config.js";
import { escapeHTML as e } from "./utils/html.js";
let promise;
const connect = () => promise ||= import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(({createClient})=>createClient(SUPABASE_URL,SUPABASE_ANON_KEY)).catch(err=>{promise=null;throw err;});
const modes=["Survival","Hardcore","PvP","Skyblock","Creativo"];
const options=values=>values.map(v=>`<option value="${v}">${v}</option>`).join("");
export function communityLiveView(){return `<section class="section-wrap sh-page" id="community-live">
<div class="sh-intro"><div><p class="eyebrow">SPAWNLY · COMUNIDAD REAL</p><h1>Tu mundo. <span>Tu comunidad.</span></h1><p>Publica para que todos puedan verlo, incluso desde otras cuentas.</p></div><div class="sh-intro-mascot"><img src="assets/spawny/spawny.png" width="115" height="145" alt="Spawny"></div></div>
<div class="sh-panel" style="padding:20px;margin:20px 0"><p id="cl-status" role="status">Conectando…</p><div id="cl-auth" hidden><p>Necesitas una cuenta de Spawnly para publicar.</p><a href="#social" class="sh-primary">Iniciar sesión o registrarme →</a></div>
<form id="cl-form" hidden><h2>Crear publicación</h2><label>Título<input name="title" required minlength="3" maxlength="90"></label><label>Descripción<textarea name="description" required minlength="10" maxlength="600" rows="3"></textarea></label><label>Edición<select name="edition">${options(["Java","Bedrock"])}</select></label><label>Modalidad<select name="mode">${options(modes)}</select></label><button class="sh-primary" type="submit">Publicar para todos →</button><p class="sh-note">No publiques información privada.</p></form></div>
<div class="sh-panel" style="padding:20px"><div class="sh-panel-title"><h2>Publicaciones</h2><button id="cl-refresh" class="sh-quiet" type="button">Actualizar ↻</button></div><div id="cl-posts">Cargando…</div></div></section>`;}
export function mountCommunityLive(){
 let alive=true,db,user=null,interval,authSubscription;
 const root=document.querySelector("#community-live");if(!root)return ()=>{};
 const get=s=>root.querySelector(s),status=s=>{if(alive)get("#cl-status").textContent=s;};
 async function load(){if(!alive||!db)return;
  const {data,error}=await db.from("community_posts").select("id,author_id,title,description,edition,mode,created_at,profiles!community_posts_author_id_fkey(username)").order("created_at",{ascending:false}).limit(100);
  if(!alive)return;if(error){status("Error al cargar: "+error.message);return;}
  const posts=data||[];
  get("#cl-posts").innerHTML=posts.length?posts.map(p=>{
    const username=p.profiles?.username||"Jugador";
    return `<article class="cl-post"><div class="cl-post-head"><strong>${e(username)}</strong><small>${e(new Date(p.created_at).toLocaleDateString("es-EC"))}</small></div><div class="cl-post-tags"><span>${e(p.edition)}</span><span>${e(p.mode)}</span></div><h3>${e(p.title)}</h3><p>${e(p.description)}</p>${user?.id===p.author_id?`<button type="button" class="sh-quiet" data-cl-delete="${e(p.id)}">Eliminar mi publicación</button>`:""}</article>`;
  }).join(""):`<p class="sh-muted">Todavía no hay publicaciones. ¡Sé el primero!</p>`;
  status("Publicaciones compartidas: "+posts.length);
 }
 async function auth(){const {data,error}=await db.auth.getUser();if(!alive)return;user=error?null:data.user;get("#cl-form").hidden=!user;get("#cl-auth").hidden=!!user;await load();}
 async function submit(event){event.preventDefault();if(!user){location.hash="social";return;}const form=event.target;if(!form.reportValidity())return;
  const fd=new FormData(form),title=String(fd.get("title")).trim(),description=String(fd.get("description")).trim();
  if(title.length<3||title.length>90||description.length<10||description.length>600)return;
  const button=form.querySelector("[type=submit]");button.disabled=true;status("Publicando…");
  const {error}=await db.from("community_posts").insert({author_id:user.id,title,description,edition:fd.get("edition"),mode:fd.get("mode")});
  button.disabled=false;if(!alive)return;if(error){status("No se pudo publicar: "+error.message);return;}form.reset();await load();status("¡Publicación visible para todos!");
 }
 async function click(event){if(event.target.closest("#cl-refresh")){await auth();return;}const button=event.target.closest("[data-cl-delete]");if(!button||!user)return;
  if(!confirm("¿Eliminar tu publicación?"))return;const {error}=await db.from("community_posts").delete().eq("id",button.dataset.clDelete).eq("author_id",user.id);
  if(!alive)return;if(error)status(error.message);else await load();
 }
 root.addEventListener("submit",submit);root.addEventListener("click",click);
 (async()=>{try{db=await connect();if(!alive)return;await auth();if(!alive)return;
  const {data}=db.auth.onAuthStateChange(()=>{if(alive)queueMicrotask(()=>{if(alive)auth();});});authSubscription=data.subscription;
  interval=setInterval(()=>{if(alive)load();},15000);
 }catch(error){status("No se pudo conectar. Revisa tu conexión.");}})();
 return ()=>{alive=false;clearInterval(interval);authSubscription?.unsubscribe();root.removeEventListener("submit",submit);root.removeEventListener("click",click);};
}
