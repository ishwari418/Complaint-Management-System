(function(){
const me=Auth.guard();if(!me)return;initShell(me);
const root=document.getElementById('detail');document.getElementById('backLink').href=Auth.home(me.role);
function render(){
 const id=new URLSearchParams(location.search).get('id'),c=id&&CMS.get(id);
 const ok=c&&(me.role==='admin'||(me.role==='user'&&c.userId===me.id)||(me.role==='department'&&c.deptId===me.deptId));
 if(!ok){root.replaceChildren(h('div',{class:'panel empty'},h('h2',{},'Complaint not found'),h('p',{},'This complaint does not exist, or you do not have access to it.')));return}
 const hist=CMS.historyFor(c.id),remarks=hist.filter(x=>x.actorRole==='department'&&x.remarks);
 const kv=(k,v)=>h('div',{class:'kv'},h('span',{},k),h('b',{},v));
 root.replaceChildren(
  h('div',{class:'panel'},h('div',{class:'row between'},h('div',{},h('small',{class:'mut'},c.ref),h('h2',{},c.title)),h('div',{class:'row'},pbadge(c.priority),badge(c.status))),
   h('div',{class:'grid3'},kv('Category',c.category),kv('Location',c.location),kv('Submitted',fmt(c.createdAt)),kv('Complainant',c.userName+' ('+c.userEmail+')'),kv('Department',CMS.deptName(c.deptId)),kv('Assigned on',fmt(c.assignedAt)),kv('Resolved on',fmt(c.resolvedAt)),kv('Attachment',c.attachment?c.attachment+' (name only)':'None')),
   h('h3',{},'Description'),h('p',{class:'pre'},c.description),h('div',{class:'row'},actionButtons(c,me,render))),
  c.resolutionNotes&&(c.status==='Resolved'||c.resolvedAt)?h('div',{class:'panel good-box'},h('h3',{},'Resolution notes'),h('p',{class:'pre'},c.resolutionNotes)):null,
  h('div',{class:'panel'},h('h3',{},'Department remarks'),remarks.length?h('ul',{class:'feed'},remarks.map(x=>h('li',{},x.remarks,h('small',{},x.actorName+' · '+fmt(x.at))))):h('p',{class:'mut'},'No remarks from the department yet.')),
  h('div',{class:'panel'},h('h3',{},'Status timeline'),h('ol',{class:'timeline'},hist.map(x=>h('li',{},h('div',{},x.type==='remark'?h('b',{},'Remark'):[x.from?h('span',{class:'mut'},x.from+' → '):null,badge(x.to)],' ',h('small',{},fmt(x.at))),h('p',{},x.remarks||'—'),h('small',{class:'mut'},'By '+x.actorName+' ('+x.actorRole+')'))))))}
window.refresh=render;render()})();
