(function(){
const me=Auth.guard(['admin']);if(!me)return;initShell(me);
const $=id=>document.getElementById(id),all=()=>CMS.list();
const draw=complaintTable($('complaintList'),all,{me,user:true,dept:true,filters:['status','category','priority','department'],placeholder:'Search by reference, title or user email…'});
const uq=$('userSearch');
function users(){const t=uq.value.trim().toLowerCase();
 $('userRows').replaceChildren(...CMS.read('users').filter(u=>!t||u.name.toLowerCase().includes(t)||u.email.toLowerCase().includes(t)).map(u=>h('tr',{},h('td',{},u.name),h('td',{},u.email),h('td',{},u.phone||'—'),h('td',{},h('span',{class:'badge role'},u.role==='department'?'department ('+CMS.deptName(u.deptId)+')':u.role)),h('td',{},String(all().filter(c=>c.userId===u.id).length)))))}
uq.addEventListener('input',users);
function depts(){$('deptList').replaceChildren(...CMS.read('departments').map(d=>{const l=all().filter(c=>c.deptId===d.id),res=l.filter(c=>c.status==='Resolved').length,pend=l.filter(c=>['Assigned','In Progress','Reopened'].includes(c.status)).length;
 return h('div',{class:'panel'},h('h3',{},d.name),h('p',{class:'mut'},'Staff: '+(CMS.read('users').filter(u=>u.deptId===d.id).map(u=>u.name+' ('+u.email+')').join(', ')||'none')),h('div',{class:'mini'},h('span',{},'Total ',h('b',{},String(l.length))),h('span',{},'Resolved ',h('b',{},String(res))),h('span',{},'Pending ',h('b',{},String(pend)))))}))}
window.refresh=()=>{const l=all(),n=s=>l.filter(c=>c.status===s).length;
 cards($('cards'),[['Total Users',CMS.read('users').filter(u=>u.role==='user').length],['Total Complaints',l.length],['Submitted',n('Submitted')],['Assigned',n('Assigned')],['In Progress',n('In Progress')],['Resolved',n('Resolved')],['Rejected',n('Rejected')]]);
 draw();users();depts();
 bars($('chartStatus'),CMS.STATUSES.map(s=>[s,n(s)]));bars($('chartCat'),CMS.CATEGORIES.map(c=>[c,l.filter(x=>x.category===c).length]));
 bars($('chartDept'),[...CMS.read('departments').map(d=>[d.name,l.filter(x=>x.deptId===d.id).length]),['Unassigned',l.filter(x=>!x.deptId).length]]);activity($('activity'))};
$('exportBtn').addEventListener('click',()=>{const a=h('a',{href:URL.createObjectURL(new Blob(['\ufeff'+CMS.exportCSV()],{type:'text/csv;charset=utf-8'})),download:'complaints-'+new Date().toISOString().slice(0,10)+'.csv'});document.body.append(a);a.click();a.remove();toast('CSV exported.')});
$('resetBtn').addEventListener('click',async()=>{if(await confirmBox('This resets ALL local demo data in this browser (users, complaints, history, notifications) to the original sample data. This is a demo convenience, not a security feature. Continue?','Reset demo data')){CMS.reset();toast('Demo data has been reset.');refresh()}});
refresh()})();
