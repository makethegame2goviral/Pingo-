(() => {
  "use strict";
  const URL="https://puddgzxqekteblmlpiqv.supabase.co";
  const KEY="sb_publishable_PVR0CA2g2AXgzoUDnAE_pg_GkWb5LRb";
  const AUTH=URL+"/functions/v1/pingo-auth";
  const db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=s=>document.querySelector(s);
  const state={mode:"login",user:null,chatId:null,chatName:"",channel:null,searchTimer:null,searchSeq:0,sending:false,installPrompt:null};
  const el={auth:$("#authCard"),app:$("#appCard"),brand:$("#brand"),form:$("#authForm"),message:$("#message"),submit:$("#submitButton"),messenger:$("#messenger"),sidebar:$("#chatSidebar"),search:$("#peopleSearch"),results:$("#searchResults"),list:$("#chatList"),empty:$("#chatEmpty"),active:$("#activeChat"),messages:$("#messages"),messageArea:$("#messageArea"),input:$("#messageInput"),send:$("#sendButton"),status:$("#appStatus")};
  function status(text=""){el.status.textContent=text;}
  function setMode(mode){state.mode=mode;$("#loginTab").classList.toggle("active",mode==="login");$("#registerTab").classList.toggle("active",mode==="register");$("#loginTab").setAttribute("aria-selected",String(mode==="login"));$("#registerTab").setAttribute("aria-selected",String(mode==="register"));el.submit.querySelector("span").textContent=mode==="login"?"Anmelden":"Konto erstellen";$("#password").autocomplete=mode==="login"?"current-password":"new-password";$("#password").placeholder=mode==="login"?"Dein Passwort":"Mindestens 8 Zeichen";el.message.textContent="";}
  function setBusy(button,busy){button.disabled=busy;button.setAttribute("aria-busy",String(busy));}
  function avatar(name,extra=""){const node=document.createElement("span");node.className="avatar "+extra;node.textContent=(name||"P").trim().slice(0,1).toUpperCase();return node;}
  function closeChannel(){if(state.channel){db.removeChannel(state.channel);state.channel=null;}}
  function openMobileChat(){el.messenger.classList.add("chat-open");}
  function closeMobileChat(){el.messenger.classList.remove("chat-open");}
  function scrollToBottom(){requestAnimationFrame(()=>{el.messageArea.scrollTop=el.messageArea.scrollHeight;});}
  function timeLabel(value){if(!value)return "";const d=new Date(value),now=new Date();return d.toDateString()===now.toDateString()?d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}):d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"});}
  function showApp(name){el.auth.classList.add("hidden");el.brand.classList.add("hidden");el.app.classList.remove("hidden");$("#signedInName").textContent=name;$("#profileName").textContent=name;$("#selfAvatar").textContent=name.slice(0,1).toUpperCase();loadChats();}
  function showAuth(){closeChannel();state.user=null;state.chatId=null;el.app.classList.add("hidden");el.brand.classList.remove("hidden");el.auth.classList.remove("hidden");closeMobileChat();el.empty.classList.remove("hidden");el.active.classList.add("hidden");setMode("login");}
  async function loadChats(){
    if(!state.user)return;
    el.list.innerHTML='<div class="list-loading"><span class="spinner"></span> Chats werden geladen …</div>';
    const {data,error}=await db.rpc("pingo_list_chats");
    if(error){el.list.innerHTML="";emptyNote(el.list,"Deine Chats konnten gerade nicht geladen werden.");status("Chats konnten nicht geladen werden: "+error.message);return;}
    el.list.replaceChildren();$("#chatCount").textContent=String(data?.length||0);
    if(!data?.length){emptyNote(el.list,"Noch keine Chats. Tippe auf + oder suche nach einem Namen.");return;}
    data.forEach(chat=>{
      const b=document.createElement("button");b.type="button";b.className="chat-item"+(chat.conversation_id===state.chatId?" selected":"");b.setAttribute("aria-label","Chat mit "+chat.partner_username);
      b.append(avatar(chat.partner_username));const copy=document.createElement("span");copy.className="chat-copy";
      const title=document.createElement("strong");title.textContent=chat.partner_username;
      const preview=document.createElement("small");preview.textContent=chat.last_message||"Schreib die erste Nachricht";
      const meta=document.createElement("span");meta.className="chat-meta";const time=document.createElement("time");time.textContent=timeLabel(chat.last_message_at||chat.created_at);meta.append(time);
      copy.append(title,preview);b.append(copy,meta);b.addEventListener("click",()=>openChat(chat.conversation_id,chat.partner_username));el.list.append(b);
    });
  }
  function emptyNote(parent,text){const p=document.createElement("p");p.className="empty-note";p.textContent=text;parent.append(p);}
  async function searchPeople(raw){
    const seq=++state.searchSeq,term=raw.trim().toLowerCase(),results=el.results;results.replaceChildren();
    if(term.length<2){results.classList.add("hidden");return;}
    const safe=term.replace(/[^a-z0-9_]/g,"");if(safe.length<2){results.classList.add("hidden");return;}
    results.classList.remove("hidden");const loading=document.createElement("p");loading.className="empty-note";loading.textContent="Suche …";results.append(loading);
    const {data,error}=await db.from("pingo_usernames").select("username,username_lower").ilike("username_lower",safe+"%").order("username").limit(10);
    if(seq!==state.searchSeq)return;results.replaceChildren();
    if(error){emptyNote(results,"Suche gerade nicht möglich. Bitte erneut versuchen.");return;}
    const found=(data||[]).filter(x=>x.username_lower!==state.user?.user_metadata?.username?.toLowerCase());
    if(!found.length){emptyNote(results,"Kein Benutzername gefunden.");return;}
    found.forEach(person=>{
      const b=document.createElement("button");b.type="button";b.className="person-result";b.append(avatar(person.username));
      const copy=document.createElement("span");copy.className="person-copy";const name=document.createElement("strong");name.textContent=person.username;const hint=document.createElement("small");hint.textContent="Privaten Chat öffnen";copy.append(name,hint);b.append(copy);b.addEventListener("click",()=>startChat(person.username));results.append(b);
    });
  }
  async function startChat(name){
    status();el.results.classList.add("hidden");el.search.value="";$("#clearSearch").classList.add("hidden");setBusy($("#newChatButton"),true);
    const {data,error}=await db.rpc("pingo_start_direct_chat",{target_username:name});setBusy($("#newChatButton"),false);
    if(error){status(error.message||"Chat konnte nicht gestartet werden.");return;}
    await loadChats();await openChat(data,name);
  }
  async function openChat(id,name){
    closeChannel();state.chatId=id;state.chatName=name;$("#chatTitle").textContent=name;$("#chatAvatar").textContent=name.slice(0,1).toUpperCase();
    el.empty.classList.add("hidden");el.active.classList.remove("hidden");openMobileChat();el.messages.replaceChildren();status();
    await loadMessages();await loadChats();
    state.channel=db.channel("pingo-chat-"+id).on("postgres_changes",{event:"INSERT",schema:"public",table:"pingo_messages",filter:"conversation_id=eq."+id},payload=>{
      if(state.chatId!==id)return;appendMessage(payload.new);loadChats();
    }).subscribe((channelStatus)=>{if(channelStatus==="CHANNEL_ERROR"||channelStatus==="TIMED_OUT")status("Live-Verbindung unterbrochen. Neue Nachrichten erscheinen nach erneutem Laden.");});
    el.input.focus({preventScroll:true});
  }
  function appendMessage(item){
    if(document.querySelector('[data-message-id="'+CSS.escape(item.id)+'"]'))return;
    const bubble=document.createElement("article");bubble.className="bubble"+(item.sender_id===state.user.id?" mine":"");bubble.dataset.messageId=item.id;
    const body=document.createElement("div");body.textContent=item.body;
    const time=document.createElement("small");time.textContent=new Date(item.created_at).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
    bubble.append(body,time);el.messages.append(bubble);scrollToBottom();
  }
  async function loadMessages(){
    const id=state.chatId;if(!id)return;
    const {data,error}=await db.from("pingo_messages").select("id,sender_id,body,created_at").eq("conversation_id",id).order("created_at",{ascending:false}).limit(100);
    if(error){status("Nachrichten konnten nicht geladen werden: "+error.message);return;}
    if(state.chatId!==id)return;el.messages.replaceChildren();(data||[]).reverse().forEach(appendMessage);scrollToBottom();
  }
  async function sendMessage(){
    const body=el.input.value.trim();if(!body||!state.chatId||state.sending)return;
    state.sending=true;setBusy(el.send,true);
    const {data,error}=await db.from("pingo_messages").insert({conversation_id:state.chatId,sender_id:state.user.id,body}).select("id,sender_id,body,created_at").single();
    state.sending=false;setBusy(el.send,false);
    if(error){status("Nachricht konnte nicht gesendet werden: "+error.message);return;}
    el.input.value="";resizeComposer();$("#charCount").textContent="0 / 4000";status();appendMessage(data);await loadChats();
  }
  function resizeComposer(){el.input.style.height="auto";el.input.style.height=Math.min(el.input.scrollHeight,120)+"px";}
  $("#loginTab").addEventListener("click",()=>setMode("login"));$("#registerTab").addEventListener("click",()=>setMode("register"));
  el.form.addEventListener("submit",async e=>{
    e.preventDefault();el.message.textContent="";setBusy(el.submit,true);el.submit.querySelector("span").textContent=state.mode==="login"?"Anmeldung läuft …":"Konto wird erstellt …";
    try{
      const response=await fetch(AUTH,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify({action:state.mode,username:$("#username").value.trim(),password:$("#password").value})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Anmeldung fehlgeschlagen.");
      const {error}=await db.auth.setSession(result.session);if(error)throw error;
      state.user=result.session.user;$("#password").value="";showApp(result.user.username);
    }catch(error){el.message.textContent=error.message||"Verbindung fehlgeschlagen. Bitte erneut versuchen.";}
    finally{setBusy(el.submit,false);el.submit.querySelector("span").textContent=state.mode==="login"?"Anmelden":"Konto erstellen";}
  });
  el.search.addEventListener("input",()=>{const has=el.search.value.length>0;$("#clearSearch").classList.toggle("hidden",!has);clearTimeout(state.searchTimer);state.searchTimer=setTimeout(()=>searchPeople(el.search.value),220);});
  $("#clearSearch").addEventListener("click",()=>{el.search.value="";$("#clearSearch").classList.add("hidden");el.results.classList.add("hidden");el.search.focus();});
  document.addEventListener("click",e=>{if(!el.results.contains(e.target)&&e.target!==el.search&&!$("#newChatButton").contains(e.target))el.results.classList.add("hidden");});
  function focusSearch(){el.search.focus();el.search.scrollIntoView({block:"nearest",behavior:"smooth"});}
  $("#newChatButton").addEventListener("click",focusSearch);$("#emptyNewChat").addEventListener("click",()=>{closeMobileChat();focusSearch();});
  $("#backToChats").addEventListener("click",closeMobileChat);
  $("#messageForm").addEventListener("submit",e=>{e.preventDefault();sendMessage();});
  el.input.addEventListener("input",()=>{resizeComposer();$("#charCount").textContent=el.input.value.length+" / 4000";});
  el.input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendMessage();}});
  async function logout(){closeChannel();await db.auth.signOut();showAuth();}
  $("#logoutButton").addEventListener("click",logout);$("#profileLogout").addEventListener("click",logout);
  $("#chatInfo").addEventListener("click",()=>status("Dies ist ein privater Einzelchat. Nur die beiden Chat-Mitglieder können die Nachrichten lesen."));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){el.results.classList.add("hidden");if(el.messenger.classList.contains("chat-open"))closeMobileChat();}});
  window.addEventListener("online",()=>{if(state.user)status("Verbindung wiederhergestellt.");});
  window.addEventListener("offline",()=>status("Du bist offline. Nachrichten können gerade nicht gesendet werden."));
  db.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"&&state.user){showAuth();}});
  db.auth.getSession().then(({data,error})=>{if(error){el.message.textContent="Sitzung konnte nicht geladen werden.";return;}if(data.session){state.user=data.session.user;showApp(state.user.user_metadata?.username||"PINGO");}});
  if("serviceWorker" in navigator&&location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.installPrompt=e;});
})();