(()=>{var R=new Map;function Ne(o,a){if(o&&typeof o=="object"&&!Array.isArray(o))return o;if(typeof o=="string")try{let l=JSON.parse(o);if(l&&typeof l=="object"&&!Array.isArray(l))return l}catch(l){console.warn(`Failed to parse nested runtime config: ${a}`,l)}return{}}function Pe(o){if(R.has(o))return R.get(o);let a=document.getElementById(o);if(!a)return R.set(o,{}),{};try{let l=JSON.parse(a.textContent||"{}"),m=Ne(l,o);return R.set(o,m),m}catch(l){return console.warn(`Failed to parse runtime config: ${o}`,l),R.set(o,{}),{}}}function Re(){return Pe("site-config")}function ye(){return Re().pocketbaseUrl||"http://127.0.0.1:8090"}var oe=null,ke=()=>ye();function ae(){return oe||(oe=new PocketBase(ke()),console.log("[PBClient] PocketBase instance created:",ke())),oe}var He=ae();var re=null;function V(){return re||(re=ae()),re}function xe(){let o=V();return!o||!o.authStore.isValid||!o.authStore.isAdmin?(sessionStorage.setItem("adminRedirectUrl",location.href),location.href="/ko/admin/login",!1):!0}function Ee(){let o=V();o&&o.authStore.clear(),location.href="/ko/admin/login"}var ve="admin-feedback-style",J="admin-feedback-root",F="admin-feedback-dialog",_=null;function _e(){if(document.getElementById(ve))return;let o=document.createElement("style");o.id=ve,o.textContent=`
        #${J} {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1200;
            display: grid;
            gap: 0.75rem;
            width: min(24rem, calc(100vw - 2rem));
            pointer-events: none;
        }

        .admin-feedback-toast {
            pointer-events: auto;
            border-radius: 18px;
            border: 1px solid #dbe3ef;
            background: rgba(255, 255, 255, 0.96);
            color: #0f172a;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
            padding: 0.95rem 1rem;
            line-height: 1.5;
            white-space: pre-line;
            opacity: 0;
            transform: translateY(-8px);
            transition: opacity 0.18s ease, transform 0.18s ease;
        }

        .admin-feedback-toast.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        .admin-feedback-toast--error {
            border-color: #fecaca;
            background: #fff7f7;
            color: #991b1b;
        }

        .admin-feedback-toast--success {
            border-color: #bbf7d0;
            background: #f0fdf4;
            color: #166534;
        }

        .admin-feedback-toast--info {
            border-color: #dbeafe;
            background: #eff6ff;
            color: #1d4ed8;
        }

        #${F}[hidden] {
            display: none !important;
        }

        #${F} {
            position: fixed;
            inset: 0;
            z-index: 1250;
            display: grid;
            place-items: center;
            padding: 1rem;
        }

        .admin-feedback-dialog__backdrop {
            position: absolute;
            inset: 0;
            background: rgba(15, 23, 42, 0.62);
            backdrop-filter: blur(3px);
        }

        .admin-feedback-dialog__panel {
            position: relative;
            z-index: 1;
            width: min(32rem, 100%);
            overflow: hidden;
            border-radius: 24px;
            border: 1px solid rgba(148, 163, 184, 0.22);
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
        }

        .admin-feedback-dialog__header {
            padding: 1.25rem 1.25rem 1rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .admin-feedback-dialog__title {
            margin: 0;
            color: #0f172a;
            font-size: 1.12rem;
            font-weight: 750;
        }

        .admin-feedback-dialog__body {
            display: grid;
            gap: 0.9rem;
            padding: 1.25rem;
        }

        .admin-feedback-dialog__message {
            margin: 0;
            color: #475569;
            line-height: 1.6;
            white-space: pre-line;
        }

        .admin-feedback-dialog__input {
            width: 100%;
            padding: 0.8rem 0.95rem;
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            background: #fff;
            color: #0f172a;
        }

        .admin-feedback-dialog__input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .admin-feedback-dialog__error {
            min-height: 1.25rem;
            color: #b91c1c;
            font-size: 0.875rem;
        }

        .admin-feedback-dialog__footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding: 1rem 1.25rem 1.25rem;
            border-top: 1px solid #e2e8f0;
            background: rgba(248, 250, 252, 0.92);
        }

        .admin-feedback-dialog__button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 2.8rem;
            padding: 0.82rem 1rem;
            border: 1px solid transparent;
            border-radius: 14px;
            font-weight: 700;
            line-height: 1;
            cursor: pointer;
        }

        .admin-feedback-dialog__button--cancel {
            background: #e2e8f0;
            color: #0f172a;
        }

        .admin-feedback-dialog__button--confirm {
            background: #0f172a;
            color: #fff;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
        }

        .admin-feedback-dialog__button--danger {
            background: #ef4444;
        }

        @media (max-width: 640px) {
            #${J} {
                right: 0.75rem;
                left: 0.75rem;
                width: auto;
            }

            #${F} {
                padding: 0.75rem;
            }

            .admin-feedback-dialog__header,
            .admin-feedback-dialog__body,
            .admin-feedback-dialog__footer {
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .admin-feedback-dialog__footer {
                flex-direction: column-reverse;
            }

            .admin-feedback-dialog__button {
                width: 100%;
            }
        }
    `,document.head.appendChild(o)}function Ue(){let o=document.getElementById(J);return o||(o=document.createElement("div"),o.id=J,o.setAttribute("aria-live","polite"),o.setAttribute("aria-atomic","true"),document.body.appendChild(o)),o}function Fe(){let o=document.getElementById(F);return o||(o=document.createElement("div"),o.id=F,o.hidden=!0,o.innerHTML=`
        <div class="admin-feedback-dialog__backdrop" data-admin-feedback-backdrop></div>
        <section class="admin-feedback-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="admin-feedback-dialog-title">
            <header class="admin-feedback-dialog__header">
                <h3 class="admin-feedback-dialog__title" id="admin-feedback-dialog-title"></h3>
            </header>
            <div class="admin-feedback-dialog__body">
                <p class="admin-feedback-dialog__message" id="admin-feedback-dialog-message"></p>
                <input class="admin-feedback-dialog__input" id="admin-feedback-dialog-input" type="text" hidden>
                <div class="admin-feedback-dialog__error" id="admin-feedback-dialog-error" aria-live="polite"></div>
            </div>
            <footer class="admin-feedback-dialog__footer">
                <button type="button" class="admin-feedback-dialog__button admin-feedback-dialog__button--cancel" data-admin-feedback-cancel></button>
                <button type="button" class="admin-feedback-dialog__button admin-feedback-dialog__button--confirm" data-admin-feedback-confirm></button>
            </footer>
        </section>
    `,document.body.appendChild(o),o.querySelector("[data-admin-feedback-backdrop]").addEventListener("click",function(){U(_?.kind==="prompt"?null:!1)}),o.querySelector("[data-admin-feedback-cancel]").addEventListener("click",function(){U(_?.kind==="prompt"?null:!1)}),o.querySelector("[data-admin-feedback-confirm]").addEventListener("click",function(){if(_){if(_.kind==="prompt"){let a=o.querySelector("#admin-feedback-dialog-input"),l=o.querySelector("#admin-feedback-dialog-error"),m=a.value.trim(),b=typeof _.validate=="function"?_.validate(m):"";if(b){l.textContent=b,a.focus();return}U(m);return}U(!0)}}),document.addEventListener("keydown",function(a){a.key!=="Escape"||!_||U(_.kind==="prompt"?null:!1)}),o)}function U(o){if(!_)return;let{resolve:a,dialog:l,previousOverflow:m,previousActiveElement:b}=_;l.hidden=!0,_=null,document.body.style.overflow=m||"",b&&typeof b.focus=="function"&&b.focus(),a(o)}function qe(o,a={}){_e();let l=Fe(),m=l.querySelector("#admin-feedback-dialog-title"),b=l.querySelector("#admin-feedback-dialog-message"),d=l.querySelector("#admin-feedback-dialog-input"),y=l.querySelector("#admin-feedback-dialog-error"),S=l.querySelector("[data-admin-feedback-cancel]"),O=l.querySelector("[data-admin-feedback-confirm]");m.textContent=a.title||"",b.textContent=a.message||"",y.textContent="",S.textContent=a.cancelLabel||"\uCDE8\uC18C",O.textContent=a.confirmLabel||"\uD655\uC778",O.classList.toggle("admin-feedback-dialog__button--danger",!!a.danger),o==="prompt"?(d.hidden=!1,d.placeholder=a.placeholder||"",d.value=a.initialValue||""):(d.hidden=!0,d.placeholder="",d.value="");let K=document.body.style.overflow,q=document.activeElement;return l.hidden=!1,document.body.style.overflow="hidden",new Promise(L=>{_={kind:o,resolve:L,dialog:l,previousOverflow:K,previousActiveElement:q,validate:a.validate},setTimeout(function(){o==="prompt"?(d.focus(),d.select()):O.focus()},0)})}function Ie(o,a={}){_e();let l=Ue(),m=document.createElement("div"),b=a.type||"info",d=a.duration||(b==="error"?4200:2800);m.className=`admin-feedback-toast admin-feedback-toast--${b}`,m.textContent=o,l.appendChild(m),requestAnimationFrame(function(){m.classList.add("is-visible")}),setTimeout(function(){m.classList.remove("is-visible"),setTimeout(function(){m.remove()},180)},d)}function Be(o={}){return qe("confirm",o)}var ze=(function(){let o,a=[],m=1,b=null,d=new Set,y=null,S={cj:{name:"CJ\uB300\uD55C\uD1B5\uC6B4",trackUrl:"https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo="},hanjin:{name:"\uD55C\uC9C4\uD0DD\uBC30",trackUrl:"https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=open&wblnum="},lotte:{name:"\uB86F\uB370\uD0DD\uBC30",trackUrl:"https://www.lotteglogis.com/open/tracking?invno="},logen:{name:"\uB85C\uC820\uD0DD\uBC30",trackUrl:"https://www.ilogen.com/web/personal/trace/"},post:{name:"\uC6B0\uCCB4\uAD6D\uD0DD\uBC30",trackUrl:"https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1="},epost:{name:"\uC6B0\uCCB4\uAD6DEMS",trackUrl:"https://service.epost.go.kr/trace.RetrieveEmsRi498.postal?POST_CODE="},kdexp:{name:"\uACBD\uB3D9\uD0DD\uBC30",trackUrl:"https://kdexp.com/basicNew498.kd?barcode="}},O="https://via.placeholder.com/50?text=No+Img",K="https://via.placeholder.com/50?text=Error",q="button, a, input, select, textarea, label",L="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",z=["order-detail-modal","delete-confirm-modal"];function h(e,t="info",n){Ie(e,{type:t,duration:n})}function we(e){return Be(e)}function W(e){switch(e){case"paid":return{label:"\uACB0\uC81C\uC644\uB8CC",classes:`${L} bg-emerald-100 text-emerald-700 ring-emerald-200`};case"shipping":return{label:"\uBC30\uC1A1\uC911",classes:`${L} bg-sky-100 text-sky-700 ring-sky-200`};case"delivered":return{label:"\uBC30\uC1A1\uC644\uB8CC",classes:`${L} bg-indigo-100 text-indigo-700 ring-indigo-200`};case"pending":return{label:"\uACB0\uC81C\uB300\uAE30",classes:`${L} bg-amber-100 text-amber-700 ring-amber-200`};case"cancelled":return{label:"\uCDE8\uC18C\uB428",classes:`${L} bg-rose-100 text-rose-700 ring-rose-200`};case"archived":return{label:"\uBCF4\uAD00\uB428",classes:`${L} bg-slate-200 text-slate-700 ring-slate-300`};default:return{label:e||"-",classes:`${L} bg-slate-100 text-slate-700 ring-slate-200`}}}function ie(){let e=z.some(t=>{let n=document.getElementById(t);return n&&!n.classList.contains("hidden")});document.body.style.overflow=e?"hidden":""}function Y(e){let t=document.getElementById(e);t&&(t.classList.remove("hidden"),t.setAttribute("aria-hidden","false"),ie())}function $(e){let t=document.getElementById(e);t&&(t.classList.add("hidden"),t.setAttribute("aria-hidden","true"),ie())}function Se(){for(let e=z.length-1;e>=0;e-=1){let t=document.getElementById(z[e]);if(t&&!t.classList.contains("hidden"))return z[e]}return null}function Le(){if(console.log("AdminOrders initializing..."),o=V(),!xe()){console.warn("Backend verification check failed.");return}$e(),de()}function $e(){let e=document.getElementById("admin-logout-btn");e&&e.addEventListener("click",()=>Ee());let t=document.getElementById("status-filter");t&&t.addEventListener("change",()=>{m=1,B()});let n=document.getElementById("refresh-btn");n&&n.addEventListener("click",de);let i=document.getElementById("bulk-archive-btn");i&&i.addEventListener("click",be);let r=document.getElementById("bulk-delete-btn");r&&r.addEventListener("click",he);let s=document.getElementById("orders-table-body");s&&(s.addEventListener("click",Ae),s.addEventListener("change",Te),s.addEventListener("keydown",Me));let g=document.getElementById("pagination-controls");g&&g.addEventListener("click",De);let f=document.getElementById("select-all-orders");f&&f.addEventListener("change",fe);let u=document.getElementById("save-tracking-btn");u&&u.addEventListener("click",le);let I=document.getElementById("archive-order-btn");I&&I.addEventListener("click",()=>ge());let c=document.getElementById("delete-order-btn");c&&c.addEventListener("click",()=>pe());let C=document.getElementById("track-delivery-btn");C&&C.addEventListener("click",me);let A=document.getElementById("tracking-carrier"),M=document.getElementById("tracking-number");A&&A.addEventListener("change",G),M&&M.addEventListener("input",G);let T=document.getElementById("confirm-delete-btn");T&&T.addEventListener("click",()=>Z()),document.querySelectorAll("[data-modal-close]").forEach(v=>{v.addEventListener("click",()=>$(v.dataset.modalClose))}),document.querySelectorAll("[data-modal-backdrop]").forEach(v=>{v.addEventListener("click",()=>$(v.dataset.modalBackdrop))}),document.addEventListener("keydown",Ce)}function Ce(e){if(e.key!=="Escape")return;let t=Se();t&&(t==="order-detail-modal"?N():$(t))}function Ae(e){let t=e.target.closest('[data-action="open-order"]');if(t){let i=t.dataset.orderId;i&&j(i);return}if(e.target.closest(".order-checkbox"))return;let n=e.target.closest("tr[data-order-id]");n&&(e.target.closest(q)||j(n.dataset.orderId))}function Te(e){let t=e.target.closest(".order-checkbox");t&&ue(t.dataset.orderId,t.checked)}function Me(e){let t=e.target.closest("tr[data-order-id]");!t||e.target.closest(q)||(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),j(t.dataset.orderId))}function De(e){let t=e.target.closest("[data-page]");if(!t||t.disabled)return;let n=Number(t.dataset.page);Number.isNaN(n)||ce(n)}function Oe(e){e&&e.querySelectorAll("img[data-fallback-src]").forEach(t=>{t.addEventListener("error",()=>{let n=t.dataset.fallbackSrc;n&&t.src!==n&&(t.src=n)},{once:!0})})}async function de(){let e=document.getElementById("orders-table-body"),t=document.getElementById("total-orders-count");e&&(e.innerHTML='<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">\uBD88\uB7EC\uC624\uB294 \uC911...</td></tr>');try{a=await o.collection("orders").getFullList({sort:"-created",expand:"user"}),t&&(t.textContent=a.length),B()}catch(n){console.error("Failed to load orders:",n),n.status===403?(h("\uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694.","error",1600),setTimeout(()=>{location.href="/ko/admin/login"},700)):e&&(e.innerHTML=`<tr><td colspan="8" class="px-4 py-10 text-center text-rose-600">\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${n.message}</td></tr>`)}}function B(){let e=document.getElementById("orders-table-body"),t=document.getElementById("status-filter"),n=t?t.value:"";if(!e)return;let i=a;n&&(i=a.filter(c=>c.status===n));let r=i.length,s=Math.max(1,Math.ceil(r/20));m>s&&(m=s);let g=(m-1)*20,f=g+20,u=i.slice(g,f);if(u.length===0){e.innerHTML='<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">\uC8FC\uBB38 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</td></tr>',se(0,0),X(),Q();return}let I="";u.forEach(c=>{let C=c.expand?.user,A=c.buyer_details?.customer?.fullName||C?.name||"Unknown",M=c.buyer_details?.customer?.email||C?.email||"-",T=new Date(c.created).toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}),v=W(c.status),ee=v.classes,te=v.label,H=c.items?c.items.length:0,w=c.items&&c.items.length>0?c.items[0].expand?.product_id?.name||c.items[0].name||"\uC0C1\uD488":"\uC0C1\uD488 \uC5C6\uC74C";H>1&&(w+=` \uC678 ${H-1}\uAC74`);let D=c.tracking_carrier||"",P=c.tracking_number||"",E=D&&S[D]?S[D].name:"",x='<span class="text-xs text-slate-500">\uBBF8\uB4F1\uB85D</span>';E&&P&&(x=`<div class="text-xs font-medium text-slate-700">${E}</div><div class="text-xs text-slate-500 break-all">${P}</div>`);let k=d.has(c.id);I+=`
                <tr class="cursor-pointer transition hover:bg-slate-50 ${k?"bg-slate-50 ring-1 ring-inset ring-slate-200":""}" data-order-id="${c.id}" tabindex="0" role="button" aria-label="\uC8FC\uBB38 \uC0C1\uC138 \uBCF4\uAE30">
                    <td>
                        <input type="checkbox" class="order-checkbox h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400" data-order-id="${c.id}" 
                               ${k?"checked":""} 
                               aria-label="\uC8FC\uBB38 \uC120\uD0DD">
                    </td>
                    <td>
                        <div class="font-semibold text-slate-900">${c.payment_id||c.id.substring(0,8)}</div>
                        <div class="text-xs text-slate-500">${T}</div>
                    </td>
                    <td>
                        <div class="text-slate-900">${A}</div>
                        <div class="text-xs text-slate-500">${M}</div>
                    </td>
                    <td>
                        <div class="text-slate-900">${w}</div>
                    </td>
                    <td>
                        <div class="font-semibold text-slate-900">${(c.total_amount||0).toLocaleString()}\uC6D0</div>
                    </td>
                    <td>
                        ${x}
                    </td>
                    <td class="text-center">
                        <span class="${ee}">
                            ${te}
                        </span>
                    </td>
                    <td class="text-center">
                        <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200" data-action="open-order" data-order-id="${c.id}">\uC0C1\uC138\uBCF4\uAE30</button>
                    </td>
                </tr>
            `}),e.innerHTML=I,se(s,m),X(),Q()}function se(e,t){let n=document.getElementById("pagination-controls");if(!n)return;if(e<=1){n.innerHTML="";return}let i="",r="inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-slate-200",s="border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",g="border-slate-900 bg-slate-900 text-white",f="cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400";i+=`<li>
            <button type="button" class="${r} ${t===1?f:s}" data-page="${t-1}" aria-label="Previous" ${t===1?"disabled":""}>
                <span aria-hidden="true">&laquo;</span>
            </button>
        </li>`;for(let u=1;u<=e;u++)i+=`<li>
                <button type="button" class="${r} ${u===t?g:s}" data-page="${u}" ${u===t?'aria-current="page"':""}>${u}</button>
            </li>`;i+=`<li>
            <button type="button" class="${r} ${t===e?f:s}" data-page="${t+1}" aria-label="Next" ${t===e?"disabled":""}>
                <span aria-hidden="true">&raquo;</span>
            </button>
        </li>`,n.innerHTML=i}function ce(e){m=Math.max(1,e),B()}async function j(e){console.log("openModal called with ID:",e);let t=a.find(p=>p.id===e);if(!t){console.error("Order not found in memory:",e);return}console.log("Full Order Object:",JSON.stringify(t,null,2));let n=document.getElementById("modal-order-status"),i=W(t.status);n.textContent=i.label,n.className=`ml-2 ${i.classes}`;let r=t.buyer_details;if(typeof r=="string")try{r=JSON.parse(r)}catch{r={}}r=r||{};let s=t.items;if(typeof s=="string")try{s=JSON.parse(s)}catch{s=[]}s=s||[];let g=t.expand?.user,f=r.customer||{},u=r.shipping_info||{},I=f.fullName||u.receiver||g?.name||"-",c=f.phoneNumber||u.phone||g?.phone||"-",C=f.email||g?.email||"-",A="-";u.address&&(A=`(${u.postcode||""}) ${u.address} ${u.detailAddress||""} ${u.extraAddress||""}`.trim()),document.getElementById("modal-payment-id").textContent=t.payment_id||t.id,document.getElementById("modal-buyer-name").textContent=I,document.getElementById("modal-buyer-phone").textContent=c,document.getElementById("modal-buyer-email").textContent=C,document.getElementById("modal-buyer-address").textContent=A,document.getElementById("modal-buyer-delivery-note").textContent=u.deliveryNote||"-",document.getElementById("modal-total-amount").textContent=(t.total_amount||0).toLocaleString()+"\uC6D0";let M=new Date(t.created).toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});document.getElementById("modal-order-date").textContent=M;let T=document.getElementById("modal-order-items"),v="";if(s&&s.length>0)for(let p of s){console.log("Processing Order Item:",p);let w=p.name||p.title||p.productName||p.product_name,D=p.price||p.discount_price||0,P=p.quantity||p.qty||1,E=p.product_id||p.productId||p.product||p.id;typeof E=="object"&&E!==null&&(E=E.id),console.log("Resolved Product ID:",E);let x=p.image?p.image.trim():"";if((!w||!x||!x.startsWith("http")&&!x.startsWith("data:"))&&E)try{let k=null;try{k=await o.collection("products").getOne(E),console.log("Fetched product by ID:",k)}catch{}if(!k)try{k=await o.collection("products").getFirstListItem(`slug="${E}"`),console.log("Fetched product by Slug:",k)}catch{}if(k&&(w||(w=k.name),(!x||!x.startsWith("http")&&!x.startsWith("data:"))&&k.images&&k.images.length>0)){let ne=k.images[0];x=o.files.getUrl(k,ne,{thumb:"100x100"})}}catch(k){console.warn("Failed to fetch product info for:",E,k)}w||(w=`\uC0C1\uD488\uBA85 \uC5C6\uC74C (${E||"ID \uC5C6\uC74C"})`),(!x||!x.startsWith("http")&&!x.startsWith("data:"))&&(x=O),v+=`
                    <div class="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center">
                        <div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                             <img src="${x}" 
                                  class="h-full w-full object-cover" 
                                  alt="${w}"
                                  loading="lazy"
                                  data-fallback-src="${K}">
                        </div>
                        <div class="min-w-0 flex-1">
                            <h6 class="mb-1 break-words text-sm font-semibold text-slate-900">${w}</h6>
                            <div class="break-words text-xs text-slate-500">ID: ${E||"-"}</div>
                            <div class="mt-1 text-sm text-slate-600">${D.toLocaleString()}\uC6D0 \xD7 ${P}\uAC1C</div>
                        </div>
                        <div class="whitespace-nowrap text-sm font-semibold text-slate-900">
                            ${(D*P).toLocaleString()}\uC6D0
                        </div>
                    </div>
                `}else v='<div class="px-4 py-8 text-center text-sm text-slate-500">\uC0C1\uD488 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';T.innerHTML=v,b=e;let ee=document.getElementById("tracking-carrier"),te=document.getElementById("tracking-number"),H=document.getElementById("track-delivery-btn");ee.value=t.tracking_carrier||"",te.value=t.tracking_number||"",H.dataset.savedTracking=t.tracking_carrier&&t.tracking_number?"true":"false",G(),Oe(T),Y("order-detail-modal")}function N(){$("order-detail-modal"),b=null}async function le(){if(!b){h("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}let e=document.getElementById("tracking-carrier").value,t=document.getElementById("tracking-number").value.trim(),n=document.getElementById("tracking-status-msg"),i=document.getElementById("track-delivery-btn");if(!e||!t){n.textContent="\uD0DD\uBC30\uC0AC\uC640 \uC6B4\uC1A1\uC7A5\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694.",n.className="mt-2 text-sm text-rose-600";return}try{n.textContent="\uC800\uC7A5 \uC911...",n.className="mt-2 text-sm text-slate-500";let r=a.find(I=>I.id===b),s=r.status==="paid"?"shipping":r.status;await o.collection("orders").update(b,{tracking_carrier:e,tracking_number:t,status:s});let g=a.findIndex(I=>I.id===b);g!==-1&&(a[g].tracking_carrier=e,a[g].tracking_number=t,a[g].status=s),n.textContent="\uC6B4\uC1A1\uC7A5\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!",n.className="mt-2 text-sm text-emerald-600",i.dataset.savedTracking="true",G();let f=document.getElementById("modal-order-status"),u=W(s);f.textContent=u.label,f.className=`ml-2 ${u.classes}`,B()}catch(r){console.error("Failed to save tracking info:",r),n.textContent="\uC800\uC7A5 \uC2E4\uD328: "+r.message,n.className="mt-2 text-sm text-rose-600"}}function me(){let e=document.getElementById("tracking-carrier").value,t=document.getElementById("tracking-number").value.trim();if(!e||!t||!S[e]){h("\uD0DD\uBC30\uC0AC \uB610\uB294 \uC6B4\uC1A1\uC7A5\uBC88\uD638\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}let n=S[e].trackUrl+encodeURIComponent(t);open(n,"_blank")}function G(){let e=document.getElementById("tracking-carrier"),t=document.getElementById("tracking-number"),n=document.getElementById("track-delivery-btn"),i=document.getElementById("tracking-status-msg");if(!e||!t||!n||!i)return;let r=e.value,s=t.value.trim(),g=!!(r&&s&&S[r]),f=n.dataset.savedTracking==="true";if(n.classList.toggle("hidden",!g),!g){if(!s&&!r){i.textContent="",i.className="mt-2 text-sm text-slate-500";return}i.textContent="\uD0DD\uBC30\uC0AC\uC640 \uC6B4\uC1A1\uC7A5\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD558\uBA74 \uBC30\uC1A1 \uC870\uD68C\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",i.className="mt-2 text-sm text-slate-500";return}i.textContent=f?`${S[r].name} \uC6B4\uC1A1\uC7A5\uC774 \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.`:`${S[r].name} \uBC30\uC1A1 \uC870\uD68C\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC800\uC7A5 \uD6C4 \uC8FC\uBB38 \uC0C1\uD0DC\uB97C \uD568\uAED8 \uBC18\uC601\uD558\uC138\uC694.`,i.className=`mt-2 text-sm ${f?"text-emerald-600":"text-sky-600"}`}function ue(e,t=null){t===null?d.has(e)?d.delete(e):d.add(e):t?d.add(e):d.delete(e),X(),Q()}function fe(){let e=document.getElementById("select-all-orders"),t=document.getElementById("status-filter"),n=t?t.value:"";if(!e)return;let i=a;n&&(i=a.filter(f=>f.status===n));let r=(m-1)*20,s=r+20,g=i.slice(r,s);e.checked?g.forEach(f=>d.add(f.id)):g.forEach(f=>d.delete(f.id)),B()}function Q(){let e=document.getElementById("select-all-orders");if(!e)return;let t=document.querySelectorAll(".order-checkbox"),n=t.length>0&&Array.from(t).every(r=>r.checked),i=t.length>0&&Array.from(t).some(r=>r.checked);e.checked=n,e.indeterminate=i&&!n}function X(){let e=document.getElementById("bulk-actions"),t=document.getElementById("selected-count");!e||!t||(d.size>0?(e.classList.remove("hidden"),t.textContent=d.size):e.classList.add("hidden"))}async function ge(e=null){let t=e||b;if(!t){h("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}try{await o.collection("orders").update(t,{status:"archived"});let n=a.findIndex(i=>i.id===t);n!==-1&&(a[n].status="archived"),h("\uC8FC\uBB38\uC774 \uBCF4\uAD00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.","success"),N(),B()}catch(n){console.error("Failed to archive order:",n),h("\uBCF4\uAD00 \uC2E4\uD328: "+n.message,"error")}}async function be(){if(d.size===0){h("\uC120\uD0DD\uB41C \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}if(await we({title:"\uC8FC\uBB38 \uC77C\uAD04 \uBCF4\uAD00",message:`${d.size}\uAC1C\uC758 \uC8FC\uBB38\uC744 \uBCF4\uAD00\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`,confirmLabel:"\uBCF4\uAD00"}))try{let t=Array.from(d).map(n=>o.collection("orders").update(n,{status:"archived"}));await Promise.all(t),d.forEach(n=>{let i=a.findIndex(r=>r.id===n);i!==-1&&(a[i].status="archived")}),h(`${d.size}\uAC1C\uC758 \uC8FC\uBB38\uC774 \uBCF4\uAD00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,"success"),d.clear(),B()}catch(t){console.error("Failed to bulk archive:",t),h("\uC77C\uAD04 \uBCF4\uAD00 \uC2E4\uD328: "+t.message,"error")}}function pe(e=null){if(y=e||b,!y){h("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}let t=a.find(n=>n.id===y);if(t){let n=document.getElementById("delete-order-info");n.textContent=`\uC8FC\uBB38\uBC88\uD638: ${t.payment_id||t.id.substring(0,8)}`}Y("delete-confirm-modal")}async function Z(){if(!y){h("\uC0AD\uC81C\uD560 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}try{await o.collection("orders").delete(y),a=a.filter(e=>e.id!==y),d.delete(y),$("delete-confirm-modal"),N(),h("\uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.","success"),document.getElementById("total-orders-count").textContent=a.length,B()}catch(e){console.error("Failed to delete order:",e),h("\uC0AD\uC81C \uC2E4\uD328: "+e.message,"error")}finally{y=null}}async function he(){if(d.size===0){h("\uC120\uD0DD\uB41C \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}let e=document.getElementById("delete-order-info");e.textContent=`\uC120\uD0DD\uB41C ${d.size}\uAC1C\uC758 \uC8FC\uBB38\uC744 \uC0AD\uC81C\uD569\uB2C8\uB2E4.`,y="BULK_DELETE",Y("delete-confirm-modal")}return Z=async function(){if(y==="BULK_DELETE")try{let e=Array.from(d).map(n=>o.collection("orders").delete(n));await Promise.all(e),a=a.filter(n=>!d.has(n.id));let t=d.size;d.clear(),$("delete-confirm-modal"),h(`${t}\uAC1C\uC758 \uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,"success"),document.getElementById("total-orders-count").textContent=a.length,B()}catch(e){console.error("Failed to bulk delete:",e),h("\uC77C\uAD04 \uC0AD\uC81C \uC2E4\uD328: "+e.message,"error")}finally{y=null}else{if(!y){h("\uC0AD\uC81C\uD560 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}try{await o.collection("orders").delete(y),a=a.filter(e=>e.id!==y),d.delete(y),$("delete-confirm-modal"),N(),h("\uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.","success"),document.getElementById("total-orders-count").textContent=a.length,B()}catch(e){console.error("Failed to delete order:",e),h("\uC0AD\uC81C \uC2E4\uD328: "+e.message,"error")}finally{y=null}}},{init:Le,openModal:j,closeModal:N,setPage:ce,saveTrackingInfo:le,openTrackingUrl:me,toggleSelectOrder:ue,toggleSelectAll:fe,archiveOrder:ge,bulkArchive:be,confirmDelete:pe,deleteOrder:Z,bulkDelete:he}})();document.addEventListener("DOMContentLoaded",()=>{ze.init()});})();
