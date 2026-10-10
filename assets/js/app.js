/* Shared UI helpers. All dynamic text is inserted with textContent (no unsafe innerHTML). */
const h=(tag,attrs={},...kids)=>{const e=document.createElement(tag);
 for(const[k,v]of Object.entries(attrs||{})){if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v===true?'':v)}
 kids.flat(3).forEach(c=>{if(c!=null&&c!==false)e.append(c)});return e};
const fmt=iso=>{const d=iso?new Date(iso):null;return d&&!isNaN(d)?d.toLocaleString(undefined,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'};
const slug=s=>String(s).toLowerCase().replace(/\s+/g,'-');
const badge=s=>h('span',{class:'badge st-'+slug(s)},s);
const pbadge=p=>h('span',{class:'badge pr-'+slug(p)},p);
function toast(msg,type='ok'){let b=document.getElementById('toasts');if(!b){b=h('div',{id:'toasts',class:'toasts'});document.body.append(b)}
 const t=h('div',{class:'toast '+type,role:'status'},msg);b.append(t);setTimeout(()=>t.remove(),3800)}
function modal(title,body,okText,onOk,onCancel){
 const cancel=()=>{ov.remove();onCancel&&onCancel()},err=h('p',{class:'msg err'});
 const ov=h('div',{class:'overlay',onclick:e=>{if(e.target===ov)cancel()}},h('div',{class:'dialog',role:'dialog','aria-modal':'true'},h('h3',{},title),body,err,
  h('div',{class:'row end'},h('button',{class:'btn ghost',onclick:cancel},'Cancel'),okText&&h('button',{class:'btn',onclick:()=>{const r=onOk();if(r===true)ov.remove();else err.textContent=r||''}},okText))));
 document.body.append(ov);return ov}
const confirmBox=(msg,ok='Confirm')=>new Promise(res=>modal('Please confirm',h('p',{},msg),ok,()=>{res(true);return true},()=>res(false)));
function cards(root,items){root.replaceChildren(...items.map(([l,v])=>h('div',{class:'stat'},h('span',{},l),h('b',{},String(v)))))}
function bars(root,data){const max=Math.max(1,...data.map(d=>d[1]));
 root.replaceChildren(...data.map(([l,v])=>h('div',{class:'bar-row'},h('span',{class:'bar-l'},l),h('div',{class:'bar-t'},h('div',{class:'bar-f',style:'width:'+(v/max*100)+'%'})),h('b',{},String(v)))))}
function activity(root,ids){const map=Object.fromEntries(CMS.list().map(c=>[c.id,c]));
 const e=CMS.read('history').filter(x=>map[x.complaintId]&&(!ids||ids.has(x.complaintId))).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8);
 root.replaceChildren(...(e.length?e.map(x=>h('li',{},h('a',{class:'link',href:'complaint-details.html?id='+encodeURIComponent(x.complaintId)},map[x.complaintId].ref),' — '+(x.type==='remark'?'remark added':(x.from?x.from+' → ':'')+x.to)+' by '+x.actorName,h('small',{},fmt(x.at)))):[h('li',{class:'mut'},'No recent activity.')]))}
function initShell(u){
 const $=id=>document.getElementById(id);
 if($('userName'))$('userName').textContent=u.name;
 if($('userRole'))$('userRole').textContent=u.role==='department'?CMS.deptName(u.deptId)+' Staff':u.role==='admin'?'Administrator':'User';
 if($('logoutBtn'))$('logoutBtn').addEventListener('click',async()=>{if(await confirmBox('Log out of your account?','Log out'))Auth.logout()});
 const tabs=[...document.querySelectorAll('.tabs [data-view]')];
 window.showView=v=>{tabs.forEach(t=>t.classList.toggle('active',t.dataset.view===v));document.querySelectorAll('.view').forEach(s=>s.hidden=s.id!=='view-'+v)};
 tabs.forEach(t=>t.addEventListener('click',()=>showView(t.dataset.view)));
 if(tabs.length)showView(tabs[0].dataset.view);
 window.addEventListener('storage',()=>window.refresh&&window.refresh())}
function assignDialog(c,actor,run){
 const sel=h('select',{class:'inp'},CMS.read('departments').map(d=>h('option',{value:d.id,selected:d.id===c.deptId},d.name)));
 const ta=h('textarea',{class:'inp',rows:3,placeholder:'Assignment remarks (optional)'});
 modal((c.deptId?'Reassign ':'Assign ')+c.ref,h('div',{},h('label',{class:'lbl'},'Department'),sel,h('label',{class:'lbl'},'Remarks'),ta),'Assign',()=>{run(CMS.assign(c.id,sel.value,ta.value,actor));return true})}
function actionButtons(c,u,done){
 const out=[],actor={name:u.name,role:u.role},btn=(t,cls,fn)=>out.push(h('button',{class:'btn sm '+cls,onclick:fn},t));
 const run=r=>{if(r.ok){toast('Complaint updated.');done&&done()}else toast(r.error,'err')};
 const ask=(title,label,ok,req,fn)=>{const ta=h('textarea',{class:'inp',rows:4});modal(title,h('div',{},h('label',{class:'lbl'},label+(req?' *':'')),ta),ok,()=>{if(req&&!ta.value.trim())return label+' is required.';fn(ta.value);return true})};
 if(u.role==='admin'){
  if(['Submitted','Assigned','In Progress','Reopened'].includes(c.status))btn(c.deptId?'Reassign':'Assign','',()=>assignDialog(c,actor,run));
  if(['Submitted','Assigned'].includes(c.status))btn('Reject','danger',()=>ask('Reject complaint','Reason for rejection','Reject',true,v=>run(CMS.setStatus(c.id,'Rejected',v,actor))))}
 if(u.role==='department'&&c.deptId===u.deptId){
  if(['Assigned','Reopened'].includes(c.status))btn('Start work','',()=>ask('Start work','Progress remarks (optional)','Start',false,v=>run(CMS.setStatus(c.id,'In Progress',v||'Work started.',actor))));
  if(c.status==='In Progress')btn('Resolve','good',()=>ask('Resolve complaint','Resolution notes','Mark resolved',true,v=>run(CMS.setStatus(c.id,'Resolved',v,actor))));
  if(['Assigned','In Progress','Reopened'].includes(c.status))btn('Add remark','ghost',()=>ask('Add progress remark','Remarks','Save',true,v=>run(CMS.addRemark(c.id,v,actor))))}
 if(u.role==='user'&&c.userId===u.id&&c.status==='Resolved')btn('Reopen','ghost',()=>ask('Reopen complaint','Why is this not resolved?','Reopen',true,v=>run(CMS.setStatus(c.id,'Reopened',v,actor))));
 return out}
function complaintTable(root,getList,o={}){
 const f=o.filters||['status','category'],sel={};
 const q=h('input',{type:'search',class:'inp',placeholder:o.placeholder||'Search by reference or title…','aria-label':'Search'});
 const mk=(k,l,opts)=>{sel[k]=h('select',{class:'inp','aria-label':l},h('option',{value:''},'All '+l),opts.map(x=>h('option',{value:x},x)));return sel[k]};
 const bar=h('div',{class:'filters'},q);
 if(f.includes('status'))bar.append(mk('status','statuses',CMS.STATUSES));
 if(f.includes('category'))bar.append(mk('category','categories',CMS.CATEGORIES));
 if(f.includes('priority'))bar.append(mk('priority','priorities',CMS.PRIORITIES));
 if(f.includes('department'))bar.append(mk('department','departments',CMS.read('departments').map(d=>d.name)));
 const body=h('tbody'),empty=h('div',{class:'empty'},o.empty||'No complaints found.');
 const head=['Reference','Title','Category','Priority','Status',...(o.user?['User']:[]),...(o.dept?['Department']:[]),'Submitted','Actions'];
 root.append(bar,h('div',{class:'table-wrap'},h('table',{class:'tbl'},h('thead',{},h('tr',{},head.map(x=>h('th',{},x)))),body)),empty);
 const v=k=>sel[k]?sel[k].value:'';
 function draw(){const t=q.value.trim().toLowerCase();
  const rows=getList().filter(c=>(!t||c.ref.toLowerCase().includes(t)||c.title.toLowerCase().includes(t)||(o.user&&c.userEmail.toLowerCase().includes(t)))&&(!v('status')||c.status===v('status'))&&(!v('category')||c.category===v('category'))&&(!v('priority')||c.priority===v('priority'))&&(!v('department')||CMS.deptName(c.deptId)===v('department'))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  body.replaceChildren(...rows.map(c=>h('tr',{},h('td',{},h('a',{class:'link',href:'complaint-details.html?id='+encodeURIComponent(c.id)},c.ref)),h('td',{class:'ttl'},c.title),h('td',{},c.category),h('td',{},pbadge(c.priority)),h('td',{},badge(c.status)),o.user&&h('td',{},c.userEmail),o.dept&&h('td',{},CMS.deptName(c.deptId)),h('td',{},fmt(c.createdAt)),
   h('td',{class:'acts'},h('a',{class:'btn sm ghost',href:'complaint-details.html?id='+encodeURIComponent(c.id)},'View'),o.me?actionButtons(c,o.me,()=>window.refresh()):null))));
  empty.hidden=rows.length>0}
 [q,...Object.values(sel)].forEach(e=>e.addEventListener('input',draw));return draw}
