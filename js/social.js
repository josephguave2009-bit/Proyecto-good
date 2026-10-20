import { SUPABASE_URL, SUPABASE_ANON_KEY } from './social-config.js';
const $ = id => document.getElementById(id);
const say = message => { $('status').textContent = message || ''; };
const element = (tag, txt, klass='') => { const e=document.createElement(tag);e.textContent=txt;e.className=klass;return e; };
const line = (label, buttons=[]) => {const item=element('div','','line');item.append(element('span',label));const actions=element('div','','actions');for(const [txt,cb] of buttons){const b=element('button',txt,'small outline');b.type='button';b.onclick=cb;actions.append(b);}item.append(actions);return item;};
const setList = (id, nodes, empty='Todavía no hay resultados.') => $(id).replaceChildren(...(nodes.length ? nodes : [element('p',empty,'muted')]));
let db,user,profiles=[],requests=[],groups=[],members=[],chat=null,sessionVersion=0,channel=null;
function fail(e){say(e?.message || 'Ocurrió un error. Inténtalo de nuevo.');}
function ok(data){ if(data?.error) throw data.error; return data?.data; }
const me = () => user?.id;
const friendReq = p => requests.find(r=>r.status==='accepted'&&([r.sender_id,r.receiver_id].includes(p.id)));
const friendIds=()=> new Set(requests.filter(r=>r.status==='accepted').map(r=>r.sender_id===me()?r.receiver_id:r.sender_id));
function labelName(id){return profiles.find(p=>p.id===id)?.username || 'Jugador';}
async function refresh(){
 if(!user)return;
 const v=sessionVersion;
 try {
  const [p,r,g,m]=await Promise.all([db.from('profiles').select('id,username,bio,edition').order('created_at',{ascending:false}).limit(200),db.from('friend_requests').select('*'),db.from('game_groups').select('*').order('created_at',{ascending:false}).limit(100),db.from('group_members').select('*')]);
  if(v!==sessionVersion)return;
  profiles=ok(p)||[];requests=ok(r)||[];groups=ok(g)||[];members=ok(m)||[];
  paint();if(chat)await loadChat();
 }catch(e){fail(e);}
}
function paint(){
 const mine=profiles.find(p=>p.id===me());if(mine){if(document.activeElement!==$('username'))$('username').value=mine.username;if(document.activeElement!==$('bio'))$('bio').value=mine.bio; $('edition').value=mine.edition;}
 const match=$('search').value.trim().toLowerCase();const friends=friendIds();
 setList('players',profiles.filter(p=>p.id!==me()&&(!match||p.username.toLowerCase().includes(match))).map(p=>{
 const incoming=requests.find(r=>r.sender_id===p.id&&r.receiver_id===me()&&r.status==='pending');
 const outgoing=requests.find(r=>r.sender_id===me()&&r.receiver_id===p.id&&r.status==='pending');
 const btn= friends.has(p.id)?[['Chat',()=>selectChat('direct',p.id,p.username)]]:incoming?[['Aceptar',()=>answer(incoming.id,'accepted')]]:outgoing?[]:[['Añadir',()=>requestFriend(p.id)]];
 return line(p.username+' · '+p.edition,btn);
 }), 'No encontramos más jugadores.');
 setList('requests',requests.filter(r=>r.receiver_id===me()&&r.status==='pending').map(r=>line(labelName(r.sender_id),[['Aceptar',()=>answer(r.id,'accepted')],['Rechazar',()=>answer(r.id,'rejected')]])));
 setList('friends',profiles.filter(p=>friends.has(p.id)).map(p=>line(p.username,[['Chat',()=>selectChat('direct',p.id,p.username)]])),'Aún no tienes amigos. ¡Envía una solicitud!');
 setList('groups',groups.map(g=>{let member=members.some(m=>m.group_id===g.id&&m.user_id===me());return line(g.name+(g.description?' · '+g.description:''),member?[['Chat',()=>selectChat('group',g.id,g.name)],['Salir',()=>leaveGroup(g.id)]]:[['Unirme',()=>joinGroup(g.id)]]);}));
}
async function requestFriend(id){try{ok(await db.from('friend_requests').insert({sender_id:me(),receiver_id:id}));say('Solicitud enviada.');await refresh();}catch(e){fail(e);}}
async function answer(id,status){try{ok(await db.from('friend_requests').update({status}).eq('id',id));say(status==='accepted'?'¡Ahora son amigos!':'Solicitud rechazada.');await refresh();}catch(e){fail(e);}}
async function joinGroup(id){try{ok(await db.from('group_members').insert({group_id:id,user_id:me()}));say('¡Te uniste al grupo!');await refresh();}catch(e){fail(e);}}
async function leaveGroup(id){try{ok(await db.from('group_members').delete().eq('group_id',id).eq('user_id',me()));if(chat?.type==='group'&&chat.id===id)closeChat();say('Saliste del grupo.');await refresh();}catch(e){fail(e);}}
function closeChat(){chat=null;$('chat-title').textContent='Elige un amigo o un grupo para hablar';$('messages').replaceChildren();$('message').disabled=true;$('send').disabled=true;}
async function selectChat(type,id,name){chat={type,id};$('chat-title').textContent=(type==='group'?'Grupo: ':'Chat con ')+name;$('message').disabled=false;$('send').disabled=false;await loadChat();$('message').focus();}
async function loadChat(){
 if(!chat||!user)return;
 const current=chat;let q= db.from(current.type==='group'?'group_messages':'direct_messages').select('id,sender_id,body,created_at').order('created_at',{ascending:true}).limit(100);
 if(current.type==='group')q=q.eq('group_id',current.id);
 else q=q.or(`and(sender_id.eq.${me()},receiver_id.eq.${current.id}),and(sender_id.eq.${current.id},receiver_id.eq.${me()})`);
 try{const rows=ok(await q)||[];if(chat!==current)return;const area=$('messages');area.replaceChildren(...rows.map(m=>{let bubble=element('div',m.body,'bubble'+(m.sender_id===me()?' me':''));bubble.prepend(element('small',labelName(m.sender_id)+' · '+new Date(m.created_at).toLocaleString()));return bubble;}));area.scrollTop=area.scrollHeight;}catch(e){fail(e);}
}
function startRealtime(){
 if(channel){db.removeChannel(channel);channel=null;}
 // Realtime delivers changes only if enabled. Polling provides a fallback.
 channel=db.channel('spawnly-social').on('postgres_changes',{event:'*',schema:'public',table:'direct_messages'},()=>loadChat()).on('postgres_changes',{event:'*',schema:'public',table:'group_messages'},()=>loadChat()).on('postgres_changes',{event:'*',schema:'public',table:'friend_requests'},()=>refresh()).on('postgres_changes',{event:'*',schema:'public',table:'group_members'},()=>refresh()).on('postgres_changes',{event:'*',schema:'public',table:'game_groups'},()=>refresh()).subscribe();
}
async function setUser(next){
 sessionVersion++;user=next;
 $('auth').classList.toggle('hidden',!!user);$('app').classList.toggle('hidden',!user);$('logout').classList.toggle('hidden',!user);
 if(!user){closeChat();if(channel){db.removeChannel(channel);channel=null;}say('');return;}
 say('Conectado. ¡Bienvenido a Spawnly!');await refresh();startRealtime();
}
async function init(){
 if(!SUPABASE_URL||!SUPABASE_ANON_KEY||SUPABASE_URL.includes('TU-PROYECTO')){$('setup').classList.remove('hidden');return;}
 try{const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
 const s=await db.auth.getSession();if(s.error)throw s.error;
 await setUser(s.data.session?.user||null);
 db.auth.onAuthStateChange((_event,session)=>{const id=session?.user?.id||null;if(id!==me())setTimeout(()=>setUser(session?.user||null),0);});
 }catch(e){$('setup').classList.remove('hidden');fail(e);}
}
$('auth-form').addEventListener('submit',async e=>{e.preventDefault();try{const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;say('Sesión iniciada.');}catch(e){fail(e);}});
$('signup').onclick=async()=>{try{const {data,error}=await db.auth.signUp({email:$('email').value.trim(),password:$('password').value,options:{emailRedirectTo:location.href}});if(error)throw error;say(data.session?'Cuenta creada.':'Revisa tu correo para confirmar el registro.');}catch(e){fail(e);}};
$('logout').onclick=async()=>{const {error}=await db.auth.signOut();if(error)fail(error);};
$('profile-form').addEventListener('submit',async e=>{e.preventDefault();try{const username=$('username').value.trim();if(!/^[a-zA-Z0-9_]{3,24}$/.test(username))throw Error('El apodo debe tener 3–24 letras, números o guiones bajos.');ok(await db.from('profiles').update({username,edition:$('edition').value,bio:$('bio').value.trim()}).eq('id',me()));say('Perfil actualizado.');await refresh();}catch(e){fail(e);}});
$('search').addEventListener('input',paint);
$('group-form').addEventListener('submit',async e=>{e.preventDefault();try{const name=$('group-name').value.trim(),description=$('group-desc').value.trim();if(name.length<3)throw Error('El grupo necesita un nombre de al menos 3 caracteres.');const group=ok(await db.from('game_groups').insert({owner_id:me(),name,description}).select().single());ok(await db.from('group_members').insert({group_id:group.id,user_id:me()}));$('group-form').reset();say('¡Grupo creado!');await refresh();}catch(e){fail(e);}});
$('send-form').addEventListener('submit',async e=>{e.preventDefault();if(!chat)return;const body=$('message').value.trim();if(!body)return;try{let row=chat.type==='group'?{group_id:chat.id,sender_id:me(),body}:{sender_id:me(),receiver_id:chat.id,body};ok(await db.from(chat.type==='group'?'group_messages':'direct_messages').insert(row));$('message').value='';await loadChat();}catch(e){fail(e);}});
setInterval(()=>{if(user){refresh();}},5000);
init();
