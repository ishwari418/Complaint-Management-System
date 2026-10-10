(function(){
const me=Auth.guard(['user']);if(!me)return;initShell(me);
const $=id=>document.getElementById(id),mine=()=>CMS.list().filter(c=>c.userId===me.id);
const notes=()=>CMS.read('notifications').filter(n=>n.userId===me.id).sort((a,b)=>b.at.localeCompare(a.at));
const draw=complaintTable($('complaintList'),mine,{me,dept:true,filters:['status','category']});
const f=$('complaintForm');CMS.CATEGORIES.forEach(c=>f.elements.category.append(h('option',{value:c},c)));
function renderNotes(){const l=notes(),un=l.filter(n=>!n.read).length;$('bell').textContent='🔔 '+un;
 $('noteList').replaceChildren(...(l.length?l.map(n=>h('li',{class:n.read?'':'unread'},n.complaintId?h('a',{class:'link',href:'complaint-details.html?id='+encodeURIComponent(n.complaintId)},n.message):n.message,h('small',{},fmt(n.at)))):[h('li',{class:'mut'},'No notifications yet.')]))}
window.refresh=()=>{const l=mine(),n=s=>l.filter(c=>c.status===s).length;
 cards($('cards'),[['Total Complaints',l.length],['Submitted',n('Submitted')],['Assigned',n('Assigned')],['In Progress',n('In Progress')],['Resolved',n('Resolved')]]);draw();renderNotes()};
f.addEventListener('submit',e=>{e.preventDefault();const g=n=>f.elements[n].value.trim(),file=f.elements.attachment.files[0],m=$('formMsg');
 const r=CMS.createComplaint({title:g('title'),description:g('description'),category:f.elements.category.value,priority:f.elements.priority.value,location:g('location'),attachment:file?file.name:''},me);
 if(!r.ok){m.textContent=r.error;m.className='msg err';return}
 m.textContent='';f.reset();toast('Complaint submitted. Your reference is '+r.complaint.ref);refresh();showView('overview')});
$('bell').addEventListener('click',()=>showView('notifications'));
$('markRead').addEventListener('click',()=>{const all=CMS.read('notifications');all.forEach(n=>{if(n.userId===me.id)n.read=true});CMS.write('notifications',all);refresh()});
const p=$('profileForm');p.elements.name.value=me.name;p.elements.phone.value=me.phone||'';p.elements.email.value=me.email;
p.addEventListener('submit',e=>{e.preventDefault();const n=p.elements.name.value.trim(),ph=p.elements.phone.value.trim();
 if(n.length<2||!/^[0-9+\-\s]{7,15}$/.test(ph))return toast('Enter a valid name and phone number.','err');
 CMS.updateUser(me.id,{name:n,phone:ph});$('userName').textContent=n;toast('Profile updated.')});
refresh()})();
