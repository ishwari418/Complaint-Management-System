(function(){
const me=Auth.guard(['department']);if(!me)return;initShell(me);
const $=id=>document.getElementById(id),mine=()=>CMS.list().filter(c=>c.deptId===me.deptId);
$('deptTitle').textContent=CMS.deptName(me.deptId)+' Department';
const draw=complaintTable($('complaintList'),mine,{me,user:true,filters:['status','category','priority'],placeholder:'Search by reference, title or user email…',empty:'No complaints assigned to your department.'});
window.refresh=()=>{const l=mine(),n=s=>l.filter(c=>c.status===s).length;
 cards($('cards'),[['Total Assigned',l.length],['Assigned (new)',n('Assigned')],['In Progress',n('In Progress')],['Resolved',n('Resolved')],['Reopened',n('Reopened')]]);draw();
 bars($('chartStatus'),['Assigned','In Progress','Resolved','Reopened'].map(s=>[s,n(s)]));bars($('chartCat'),CMS.CATEGORIES.map(c=>[c,l.filter(x=>x.category===c).length]).filter(x=>x[1]));
 activity($('activity'),new Set(l.map(c=>c.id)))};
refresh()})();
