/* Storage layer: all data lives in localStorage. Demo only - NOT secure. */
const CMS=(()=>{
const K={users:'cms_v1_users',departments:'cms_v1_departments',complaints:'cms_v1_complaints',history:'cms_v1_history',assignments:'cms_v1_assignments',notifications:'cms_v1_notifications',settings:'cms_v1_settings'};
const STATUSES=['Submitted','Assigned','In Progress','Resolved','Rejected','Reopened'];
const CATEGORIES=['Infrastructure','Electricity','Water Supply','Sanitation','IT Support','Transport','Hostel','Academics','Other'];
const PRIORITIES=['Low','Medium','High'];
const FLOW={'Submitted':['Assigned','Rejected'],'Assigned':['In Progress','Rejected'],'In Progress':['Resolved','Assigned'],'Resolved':['Reopened'],'Rejected':[],'Reopened':['Assigned','In Progress']};
const read=k=>{try{const v=JSON.parse(localStorage.getItem(K[k]));if(k==='settings')return v&&typeof v==='object'&&!Array.isArray(v)?v:{};return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[]}catch(e){return k==='settings'?{}:[]}};
const write=(k,v)=>{try{localStorage.setItem(K[k],JSON.stringify(v));return true}catch(e){return false}};
const uid=p=>p+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const nowISO=()=>new Date().toISOString();
const dept=id=>read('departments').find(d=>d.id===id);
const deptName=id=>(dept(id)||{}).name||'Unassigned';
const list=()=>read('complaints');
const get=id=>list().find(c=>c.id===id);
const historyFor=id=>read('history').filter(x=>x.complaintId===id).sort((a,b)=>a.at.localeCompare(b.at));
function nextRef(){const s=read('settings');s.counter=(s.counter||0)+1;write('settings',s);return 'CMP-'+new Date().getFullYear()+'-'+String(s.counter).padStart(5,'0')}
function notify(userId,message,complaintId){const n=read('notifications');n.push({id:uid('n'),userId,message,complaintId:complaintId||null,at:nowISO(),read:false});write('notifications',n)}
function save(c){const all=list(),i=all.findIndex(x=>x.id===c.id);if(i<0)return false;all[i]=c;return write('complaints',all)}
function move(c,to,actor,remarks,type){const h=read('history');h.push({id:uid('h'),complaintId:c.id,from:c.status,to,at:nowISO(),actorName:actor.name,actorRole:actor.role,remarks:remarks||'',type:type||'status'});write('history',h);c.status=to}
function createComplaint(d,user){
 const t=(d.title||'').trim(),desc=(d.description||'').trim(),loc=(d.location||'').trim();
 if(t.length<5)return{ok:false,error:'Title must be at least 5 characters.'};
 if(desc.length<10)return{ok:false,error:'Please describe the problem in at least 10 characters.'};
 if(!CATEGORIES.includes(d.category))return{ok:false,error:'Please choose a category.'};
 if(!PRIORITIES.includes(d.priority))return{ok:false,error:'Please choose a priority.'};
 if(!loc)return{ok:false,error:'Location is required.'};
 const c={id:uid('c'),ref:nextRef(),title:t,description:desc,category:d.category,priority:d.priority,location:loc,status:'Submitted',userId:user.id,userName:user.name,userEmail:user.email,deptId:null,createdAt:nowISO(),assignedAt:null,resolvedAt:null,resolutionNotes:'',attachment:d.attachment||''};
 const all=list();all.push(c);if(!write('complaints',all))return{ok:false,error:'Could not save (browser storage full or blocked).'};
 move({...c,status:''},'Submitted',{name:user.name,role:'user'},'Complaint submitted.');
 return{ok:true,complaint:c}}
function setStatus(id,to,remarks,actor){
 const c=get(id);if(!c)return{ok:false,error:'Complaint not found.'};
 if(!(FLOW[c.status]||[]).includes(to))return{ok:false,error:`Cannot change status from ${c.status} to ${to}.`};
 remarks=(remarks||'').trim();
 if(['Resolved','Rejected','Reopened'].includes(to)&&!remarks)return{ok:false,error:to==='Resolved'?'Resolution notes are required.':'Remarks are required.'};
 move(c,to,actor,remarks);
 if(to==='Resolved'){c.resolvedAt=nowISO();c.resolutionNotes=remarks}
 if(to==='Reopened')c.resolvedAt=null;
 save(c);notify(c.userId,`${c.ref} is now ${to}.`,c.id);return{ok:true,complaint:c}}
function assign(id,deptId,remarks,actor){
 const c=get(id);if(!c)return{ok:false,error:'Complaint not found.'};
 if(!dept(deptId))return{ok:false,error:'Choose a valid department.'};
 if(!['Submitted','Assigned','In Progress','Reopened'].includes(c.status))return{ok:false,error:`A ${c.status} complaint cannot be assigned.`};
 const re=c.deptId&&c.deptId!==deptId;remarks=(remarks||'').trim();
 c.deptId=deptId;c.assignedAt=nowISO();
 move(c,'Assigned',actor,(re?'Reassigned. ':'')+(remarks||'Assigned to '+deptName(deptId)+'.'),'assignment');
 const a=read('assignments');a.push({id:uid('a'),complaintId:id,deptId,remarks,at:c.assignedAt,by:actor.name});write('assignments',a);
 save(c);notify(c.userId,`${c.ref} has been assigned to ${deptName(deptId)}.`,c.id);return{ok:true,complaint:c}}
function addRemark(id,remarks,actor){
 const c=get(id);if(!c)return{ok:false,error:'Complaint not found.'};
 remarks=(remarks||'').trim();if(!remarks)return{ok:false,error:'Remarks are required.'};
 move(c,c.status,actor,remarks,'remark');save(c);notify(c.userId,`New remark on ${c.ref}.`,c.id);return{ok:true,complaint:c}}
function updateUser(id,p){const u=read('users'),x=u.find(a=>a.id===id);if(!x)return false;if(p.name)x.name=p.name;if(p.phone!==undefined)x.phone=p.phone;return write('users',u)}
function exportCSV(){
 const q=v=>{let s=String(v==null?'':v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const rows=[['Reference','Title','Category','Priority','Status','Department','User Email','Submitted','Assigned','Resolved']];
 list().forEach(c=>rows.push([c.ref,c.title,c.category,c.priority,c.status,deptName(c.deptId),c.userEmail,c.createdAt,c.assignedAt||'',c.resolvedAt||'']));
 return rows.map(r=>r.map(q).join(',')).join('\r\n')}
function seed(){
 const Y=new Date().getFullYear();
 const D=[{id:'d-maint',name:'Maintenance',email:'maintenance@cms.demo'},{id:'d-it',name:'IT',email:'it@cms.demo'},{id:'d-water',name:'Water and Sanitation',email:'water@cms.demo'}];
 const U=[
 {id:'u-admin',name:'Asha Admin',email:'admin@cms.demo',phone:'9000000001',password:'Admin@123',role:'admin'},
 {id:'u-maint',name:'Ravi Maintenance',email:'maintenance@cms.demo',phone:'9000000002',password:'Dept@123',role:'department',deptId:'d-maint'},
 {id:'u-it',name:'Ira IT Desk',email:'it@cms.demo',phone:'9000000003',password:'Dept@123',role:'department',deptId:'d-it'},
 {id:'u-water',name:'Wasim Water Desk',email:'water@cms.demo',phone:'9000000004',password:'Dept@123',role:'department',deptId:'d-water'},
 {id:'u-student',name:'Sam Student',email:'student@cms.demo',phone:'9000000005',password:'User@123',role:'user'},
 {id:'u-aarav',name:'Aarav Mehta',email:'aarav@cms.demo',phone:'9000000006',password:'User@123',role:'user'},
 {id:'u-diya',name:'Diya Rao',email:'diya@cms.demo',phone:'9000000007',password:'User@123',role:'user'}];
 const S=[
 ['Broken streetlight near Block A','Infrastructure','Medium','u-student','d-maint','In Progress',6,'Block A lane'],
 ['Wi-Fi down in the library','IT Support','High','u-student','d-it','Resolved',12,'Central Library'],
 ['Leaking tap in hostel washroom','Water Supply','Medium','u-aarav','d-water','Assigned',3,'Hostel A, Floor 2'],
 ['Overflowing garbage bin at canteen','Sanitation','Low','u-diya',null,'Submitted',1,'Canteen'],
 ['Projector not working in Room 204','IT Support','Medium','u-aarav','d-it','In Progress',4,'Room 204'],
 ['Frequent power cuts in Hostel B','Electricity','High','u-diya','d-maint','Assigned',2,'Hostel B'],
 ['Duplicate parking complaint','Other','Low','u-student',null,'Rejected',9,'Parking lot'],
 ['Cracked pavement near main gate','Infrastructure','High','u-aarav','d-maint','Resolved',15,'Main gate'],
 ['Bus timetable not displayed','Transport','Low','u-diya',null,'Submitted',0.5,'Bus stop'],
 ['Water cooler not working in Block C','Water Supply','Medium','u-student','d-water','Resolved',8,'Block C'],
 ['Campus email account locked','IT Support','High','u-diya',null,'Submitted',1,'Online'],
 ['Noisy ceiling fan in mess hall','Hostel','Low','u-aarav','d-maint','In Progress',5,'Mess hall']];
 const C=[],H=[],A=[],N=[],dn=id=>D.find(d=>d.id===id).name;
 S.forEach((s,i)=>{
  const u=U.find(x=>x.id===s[3]),t0=Date.now()-s[6]*864e5,st=s[5],staff=U.find(x=>x.deptId===s[4]);
  const c={id:'c-seed-'+(i+1),ref:'CMP-'+Y+'-'+String(i+1).padStart(5,'0'),title:s[0],description:s[0]+'. Reported by '+u.name+'. Kindly look into this at the earliest.',category:s[1],priority:s[2],location:s[7],status:st,userId:u.id,userName:u.name,userEmail:u.email,deptId:null,createdAt:new Date(t0).toISOString(),assignedAt:null,resolvedAt:null,resolutionNotes:'',attachment:''};
  let prev='';
  const add=(to,hrs,name,role,rem,type)=>{const at=new Date(t0+hrs*36e5).toISOString();H.push({id:uid('h'),complaintId:c.id,from:prev,to,at,actorName:name,actorRole:role,remarks:rem,type:type||'status'});prev=to;return at};
  add('Submitted',0,u.name,'user','Complaint submitted.');
  if(st==='Rejected')add('Rejected',3,'Asha Admin','admin','Duplicate of an existing complaint.');
  else if(st!=='Submitted'){
   c.deptId=s[4];const rem='Assigned to '+dn(s[4])+'.';c.assignedAt=add('Assigned',2,'Asha Admin','admin',rem,'assignment');
   A.push({id:uid('a'),complaintId:c.id,deptId:s[4],remarks:rem,at:c.assignedAt,by:'Asha Admin'});
   if(st==='In Progress'||st==='Resolved')add('In Progress',6,staff.name,'department','Work has started.');
   if(st==='Resolved'){c.resolutionNotes='Issue fixed and verified on site.';c.resolvedAt=add('Resolved',30,staff.name,'department',c.resolutionNotes)}
  }
  C.push(c);if(st!=='Submitted')N.push({id:uid('n'),userId:u.id,message:c.ref+' is now '+st+'.',complaintId:c.id,at:new Date(t0+3*36e5).toISOString(),read:i%2===0});
 });
 write('users',U);write('departments',D);write('complaints',C);write('history',H);write('assignments',A);write('notifications',N);
 write('settings',{counter:S.length,seeded:true,version:1})}
function init(){const s=read('settings');if(s.seeded&&read('users').length&&read('departments').length)return false;seed();return true}
function reset(){Object.values(K).forEach(k=>localStorage.removeItem(k));seed()}
return{K,STATUSES,CATEGORIES,PRIORITIES,FLOW,read,write,uid,nowISO,dept,deptName,list,get,historyFor,createComplaint,setStatus,assign,addRemark,notify,updateUser,exportCSV,init,reset}})();
try{CMS.init()}catch(e){}
