/* Demo-only authentication. Passwords are stored in plain text in localStorage; role checks are UI-level only. */
const Auth={
 SK:'cms_session',
 user(){const id=sessionStorage.getItem(Auth.SK);return id?CMS.read('users').find(u=>u.id===id)||null:null},
 home(role){return{admin:'admin-dashboard.html',department:'department-dashboard.html',user:'user-dashboard.html'}[role]||'login.html'},
 login(email,pw){const e=(email||'').trim().toLowerCase();if(!e||!pw)return{ok:false,error:'Enter your email and password.'};
  const u=CMS.read('users').find(x=>(x.email||'').toLowerCase()===e&&x.password===pw);
  if(!u)return{ok:false,error:'Invalid email or password.'};sessionStorage.setItem(Auth.SK,u.id);return{ok:true,user:u}},
 register(f){const er={},name=(f.name||'').trim(),email=(f.email||'').trim().toLowerCase(),phone=(f.phone||'').trim();
  if(name.length<2)er.name='Enter your full name.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))er.email='Enter a valid email address.';
  else if(CMS.read('users').some(u=>(u.email||'').toLowerCase()===email))er.email='This email is already registered.';
  if(!/^[0-9+\-\s]{7,15}$/.test(phone))er.phone='Enter a valid phone number.';
  if((f.password||'').length<6)er.password='Password must be at least 6 characters.';
  if(f.password!==f.confirm)er.confirm='Passwords do not match.';
  if(Object.keys(er).length)return{ok:false,errors:er};
  const users=CMS.read('users');users.push({id:CMS.uid('u'),name,email,phone,password:f.password,role:'user',createdAt:CMS.nowISO()});
  return CMS.write('users',users)?{ok:true}:{ok:false,errors:{email:'Could not save (browser storage blocked).'}}},
 logout(){sessionStorage.removeItem(Auth.SK);location.href='login.html'},
 guard(roles){const u=Auth.user();if(!u){location.replace('login.html');return null}
  if(roles&&!roles.includes(u.role)){location.replace(Auth.home(u.role));return null}return u}};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{
 const msg=document.getElementById('formMsg'),show=(t,c)=>{if(msg){msg.textContent=t;msg.className='msg '+c}};
 const lf=document.getElementById('loginForm');
 if(lf){const u=Auth.user();if(u)location.replace(Auth.home(u.role));
  lf.addEventListener('submit',e=>{e.preventDefault();const r=Auth.login(lf.elements.email.value,lf.elements.password.value);if(!r.ok)return show(r.error,'err');location.href=Auth.home(r.user.role)});
  document.querySelectorAll('[data-fill]').forEach(b=>b.addEventListener('click',()=>{lf.elements.email.value=b.dataset.fill;lf.elements.password.value=b.dataset.pw}))}
 const rf=document.getElementById('registerForm');
 if(rf)rf.addEventListener('submit',e=>{e.preventDefault();const g=n=>rf.elements[n].value;
  const r=Auth.register({name:g('name'),email:g('email'),phone:g('phone'),password:g('password'),confirm:g('confirm')});
  rf.querySelectorAll('[data-err]').forEach(s=>s.textContent=(r.errors||{})[s.dataset.err]||'');
  if(!r.ok)return show('Please fix the highlighted fields.','err');
  show('Account created! Redirecting to login…','ok');setTimeout(()=>location.href='login.html',1400)})});
