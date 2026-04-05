(()=>{var F=new Map;function Ne(o){if(F.has(o))return F.get(o);let a=document.getElementById(o);if(!a)return F.set(o,{}),{};try{let f=JSON.parse(a.textContent||"{}");return F.set(o,f),f}catch(f){return console.warn(`Failed to parse runtime config: ${o}`,f),F.set(o,{}),{}}}function Pe(){return Ne("site-config")}function ye(){return Pe().pocketbaseUrl||"http://127.0.0.1:8090"}var oe=null,ke=()=>ye();function ae(){return oe||(oe=new PocketBase(ke()),console.log("[PBClient] PocketBase instance created:",ke())),oe}var Ge=ae();var re=null;function K(){return re||(re=ae()),re}function xe(){let o=K();return!o||!o.authStore.isValid||!o.authStore.isAdmin?(sessionStorage.setItem("adminRedirectUrl",location.href),location.href="/ko/admin/login",!1):!0}function ve(){let o=K();o&&o.authStore.clear(),location.href="/ko/admin/login"}var Ee="admin-feedback-style",W="admin-feedback-root",q="admin-feedback-dialog",E=null;function _e(){if(document.getElementById(Ee))return;let o=document.createElement("style");o.id=Ee,o.textContent=`
        #${W} {
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

        #${q}[hidden] {
            display: none !important;
        }

        #${q} {
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
            #${W} {
                right: 0.75rem;
                left: 0.75rem;
                width: auto;
            }

            #${q} {
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
    `,document.head.appendChild(o)}function Re(){let o=document.getElementById(W);return o||(o=document.createElement("div"),o.id=W,o.setAttribute("aria-live","polite"),o.setAttribute("aria-atomic","true"),document.body.appendChild(o)),o}function Fe(){let o=document.getElementById(q);return o||(o=document.createElement("div"),o.id=q,o.hidden=!0,o.innerHTML=`
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
    `,document.body.appendChild(o),o.querySelector("[data-admin-feedback-backdrop]").addEventListener("click",function(){U(E?.kind==="prompt"?null:!1)}),o.querySelector("[data-admin-feedback-cancel]").addEventListener("click",function(){U(E?.kind==="prompt"?null:!1)}),o.querySelector("[data-admin-feedback-confirm]").addEventListener("click",function(){if(E){if(E.kind==="prompt"){let a=o.querySelector("#admin-feedback-dialog-input"),f=o.querySelector("#admin-feedback-dialog-error"),u=a.value.trim(),g=typeof E.validate=="function"?E.validate(u):"";if(g){f.textContent=g,a.focus();return}U(u);return}U(!0)}}),document.addEventListener("keydown",function(a){a.key!=="Escape"||!E||U(E.kind==="prompt"?null:!1)}),o)}function U(o){if(!E)return;let{resolve:a,dialog:f,previousOverflow:u,previousActiveElement:g}=E;f.hidden=!0,E=null,document.body.style.overflow=u||"",g&&typeof g.focus=="function"&&g.focus(),a(o)}function Ue(o,a={}){_e();let f=Fe(),u=f.querySelector("#admin-feedback-dialog-title"),g=f.querySelector("#admin-feedback-dialog-message"),r=f.querySelector("#admin-feedback-dialog-input"),y=f.querySelector("#admin-feedback-dialog-error"),A=f.querySelector("[data-admin-feedback-cancel]"),T=f.querySelector("[data-admin-feedback-confirm]");u.textContent=a.title||"",g.textContent=a.message||"",y.textContent="",A.textContent=a.cancelLabel||"\uCDE8\uC18C",T.textContent=a.confirmLabel||"\uD655\uC778",T.classList.toggle("admin-feedback-dialog__button--danger",!!a.danger),o==="prompt"?(r.hidden=!1,r.placeholder=a.placeholder||"",r.value=a.initialValue||""):(r.hidden=!0,r.placeholder="",r.value="");let J=document.body.style.overflow,z=document.activeElement;return f.hidden=!1,document.body.style.overflow="hidden",new Promise(w=>{E={kind:o,resolve:w,dialog:f,previousOverflow:J,previousActiveElement:z,validate:a.validate},setTimeout(function(){o==="prompt"?(r.focus(),r.select()):T.focus()},0)})}function Ie(o,a={}){_e();let f=Re(),u=document.createElement("div"),g=a.type||"info",r=a.duration||(g==="error"?4200:2800);u.className=`admin-feedback-toast admin-feedback-toast--${g}`,u.textContent=o,f.appendChild(u),requestAnimationFrame(function(){u.classList.add("is-visible")}),setTimeout(function(){u.classList.remove("is-visible"),setTimeout(function(){u.remove()},180)},r)}function Be(o={}){return Ue("confirm",o)}var qe=(function(){let o,a=[],u=1,g=null,r=new Set,y=null,A={cj:{name:"CJ\uB300\uD55C\uD1B5\uC6B4",trackUrl:"https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo="},hanjin:{name:"\uD55C\uC9C4\uD0DD\uBC30",trackUrl:"https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=open&wblnum="},lotte:{name:"\uB86F\uB370\uD0DD\uBC30",trackUrl:"https://www.lotteglogis.com/open/tracking?invno="},logen:{name:"\uB85C\uC820\uD0DD\uBC30",trackUrl:"https://www.ilogen.com/web/personal/trace/"},post:{name:"\uC6B0\uCCB4\uAD6D\uD0DD\uBC30",trackUrl:"https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1="},epost:{name:"\uC6B0\uCCB4\uAD6DEMS",trackUrl:"https://service.epost.go.kr/trace.RetrieveEmsRi498.postal?POST_CODE="},kdexp:{name:"\uACBD\uB3D9\uD0DD\uBC30",trackUrl:"https://kdexp.com/basicNew498.kd?barcode="}},T="https://via.placeholder.com/50?text=No+Img",J="https://via.placeholder.com/50?text=Error",z="button, a, input, select, textarea, label",w="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",j=["order-detail-modal","delete-confirm-modal"];function p(e,t="info",n){Ie(e,{type:t,duration:n})}function we(e){return Be(e)}function V(e){switch(e){case"paid":return{label:"\uACB0\uC81C\uC644\uB8CC",classes:`${w} bg-emerald-100 text-emerald-700 ring-emerald-200`};case"shipping":return{label:"\uBC30\uC1A1\uC911",classes:`${w} bg-sky-100 text-sky-700 ring-sky-200`};case"delivered":return{label:"\uBC30\uC1A1\uC644\uB8CC",classes:`${w} bg-indigo-100 text-indigo-700 ring-indigo-200`};case"pending":return{label:"\uACB0\uC81C\uB300\uAE30",classes:`${w} bg-amber-100 text-amber-700 ring-amber-200`};case"cancelled":return{label:"\uCDE8\uC18C\uB428",classes:`${w} bg-rose-100 text-rose-700 ring-rose-200`};case"archived":return{label:"\uBCF4\uAD00\uB428",classes:`${w} bg-slate-200 text-slate-700 ring-slate-300`};default:return{label:e||"-",classes:`${w} bg-slate-100 text-slate-700 ring-slate-200`}}}function ie(){let e=j.some(t=>{let n=document.getElementById(t);return n&&!n.classList.contains("hidden")});document.body.style.overflow=e?"hidden":""}function Y(e){let t=document.getElementById(e);t&&(t.classList.remove("hidden"),t.setAttribute("aria-hidden","false"),ie())}function L(e){let t=document.getElementById(e);t&&(t.classList.add("hidden"),t.setAttribute("aria-hidden","true"),ie())}function Se(){for(let e=j.length-1;e>=0;e-=1){let t=document.getElementById(j[e]);if(t&&!t.classList.contains("hidden"))return j[e]}return null}function Le(){if(console.log("AdminOrders initializing..."),o=K(),!xe()){console.warn("Backend verification check failed.");return}Ce(),de()}function Ce(){let e=document.getElementById("admin-logout-btn");e&&e.addEventListener("click",()=>ve());let t=document.getElementById("status-filter");t&&t.addEventListener("change",()=>{u=1,B()});let n=document.getElementById("refresh-btn");n&&n.addEventListener("click",de);let d=document.getElementById("bulk-archive-btn");d&&d.addEventListener("click",be);let i=document.getElementById("bulk-delete-btn");i&&i.addEventListener("click",he);let s=document.getElementById("orders-table-body");s&&(s.addEventListener("click",Ae),s.addEventListener("change",Me),s.addEventListener("keydown",Te));let h=document.getElementById("pagination-controls");h&&h.addEventListener("click",De);let b=document.getElementById("select-all-orders");b&&b.addEventListener("change",fe);let c=document.getElementById("save-tracking-btn");c&&c.addEventListener("click",ce);let _=document.getElementById("archive-order-btn");_&&_.addEventListener("click",()=>ge());let l=document.getElementById("delete-order-btn");l&&l.addEventListener("click",()=>pe());let C=document.getElementById("track-delivery-btn");C&&C.addEventListener("click",me);let $=document.getElementById("confirm-delete-btn");$&&$.addEventListener("click",()=>Z()),document.querySelectorAll("[data-modal-close]").forEach(S=>{S.addEventListener("click",()=>L(S.dataset.modalClose))}),document.querySelectorAll("[data-modal-backdrop]").forEach(S=>{S.addEventListener("click",()=>L(S.dataset.modalBackdrop))}),document.addEventListener("keydown",$e)}function $e(e){if(e.key!=="Escape")return;let t=Se();t&&(t==="order-detail-modal"?D():L(t))}function Ae(e){let t=e.target.closest('[data-action="open-order"]');if(t){let d=t.dataset.orderId;d&&G(d);return}if(e.target.closest(".order-checkbox"))return;let n=e.target.closest("tr[data-order-id]");n&&(e.target.closest(z)||G(n.dataset.orderId))}function Me(e){let t=e.target.closest(".order-checkbox");t&&ue(t.dataset.orderId,t.checked)}function Te(e){let t=e.target.closest("tr[data-order-id]");!t||e.target.closest(z)||(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),G(t.dataset.orderId))}function De(e){let t=e.target.closest("[data-page]");if(!t||t.disabled)return;let n=Number(t.dataset.page);Number.isNaN(n)||le(n)}function Oe(e){e&&e.querySelectorAll("img[data-fallback-src]").forEach(t=>{t.addEventListener("error",()=>{let n=t.dataset.fallbackSrc;n&&t.src!==n&&(t.src=n)},{once:!0})})}async function de(){let e=document.getElementById("orders-table-body"),t=document.getElementById("total-orders-count");e&&(e.innerHTML='<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">\uBD88\uB7EC\uC624\uB294 \uC911...</td></tr>');try{a=await o.collection("orders").getFullList({sort:"-created",expand:"user"}),t&&(t.textContent=a.length),B()}catch(n){console.error("Failed to load orders:",n),n.status===403?(p("\uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694.","error",1600),setTimeout(()=>{location.href="/ko/admin/login"},700)):e&&(e.innerHTML=`<tr><td colspan="8" class="px-4 py-10 text-center text-rose-600">\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${n.message}</td></tr>`)}}function B(){let e=document.getElementById("orders-table-body"),t=document.getElementById("status-filter"),n=t?t.value:"";if(!e)return;let d=a;n&&(d=a.filter(l=>l.status===n));let i=d.length,s=Math.max(1,Math.ceil(i/20));u>s&&(u=s);let h=(u-1)*20,b=h+20,c=d.slice(h,b);if(c.length===0){e.innerHTML='<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">\uC8FC\uBB38 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</td></tr>',se(0,0),X(),Q();return}let _="";c.forEach(l=>{let C=l.expand?.user,$=l.buyer_details?.customer?.fullName||C?.name||"Unknown",S=l.buyer_details?.customer?.email||C?.email||"-",H=new Date(l.created).toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}),M=V(l.status),ee=M.classes,te=M.label,O=l.items?l.items.length:0,m=l.items&&l.items.length>0?l.items[0].expand?.product_id?.name||l.items[0].name||"\uC0C1\uD488":"\uC0C1\uD488 \uC5C6\uC74C";O>1&&(m+=` \uC678 ${O-1}\uAC74`);let I=l.tracking_carrier||"",P=l.tracking_number||"",R=I&&A[I]?A[I].name:"",x='<span class="text-xs text-slate-500">\uBBF8\uB4F1\uB85D</span>';R&&P&&(x=`<div class="text-xs font-medium text-slate-700">${R}</div><div class="text-xs text-slate-500 break-all">${P}</div>`);let k=r.has(l.id);_+=`
                <tr class="cursor-pointer transition hover:bg-slate-50 ${k?"bg-slate-50 ring-1 ring-inset ring-slate-200":""}" data-order-id="${l.id}" tabindex="0" role="button" aria-label="\uC8FC\uBB38 \uC0C1\uC138 \uBCF4\uAE30">
                    <td>
                        <input type="checkbox" class="order-checkbox h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400" data-order-id="${l.id}" 
                               ${k?"checked":""} 
                               aria-label="\uC8FC\uBB38 \uC120\uD0DD">
                    </td>
                    <td>
                        <div class="font-semibold text-slate-900">${l.payment_id||l.id.substring(0,8)}</div>
                        <div class="text-xs text-slate-500">${H}</div>
                    </td>
                    <td>
                        <div class="text-slate-900">${$}</div>
                        <div class="text-xs text-slate-500">${S}</div>
                    </td>
                    <td>
                        <div class="text-slate-900">${m}</div>
                    </td>
                    <td>
                        <div class="font-semibold text-slate-900">${(l.total_amount||0).toLocaleString()}\uC6D0</div>
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
                        <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200" data-action="open-order" data-order-id="${l.id}">\uC0C1\uC138\uBCF4\uAE30</button>
                    </td>
                </tr>
            `}),e.innerHTML=_,se(s,u),X(),Q()}function se(e,t){let n=document.getElementById("pagination-controls");if(!n)return;if(e<=1){n.innerHTML="";return}let d="",i="inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-slate-200",s="border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",h="border-slate-900 bg-slate-900 text-white",b="cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400";d+=`<li>
            <button type="button" class="${i} ${t===1?b:s}" data-page="${t-1}" aria-label="Previous" ${t===1?"disabled":""}>
                <span aria-hidden="true">&laquo;</span>
            </button>
        </li>`;for(let c=1;c<=e;c++)d+=`<li>
                <button type="button" class="${i} ${c===t?h:s}" data-page="${c}" ${c===t?'aria-current="page"':""}>${c}</button>
            </li>`;d+=`<li>
            <button type="button" class="${i} ${t===e?b:s}" data-page="${t+1}" aria-label="Next" ${t===e?"disabled":""}>
                <span aria-hidden="true">&raquo;</span>
            </button>
        </li>`,n.innerHTML=d}function le(e){u=Math.max(1,e),B()}async function G(e){console.log("openModal called with ID:",e);let t=a.find(m=>m.id===e);if(!t){console.error("Order not found in memory:",e);return}console.log("Full Order Object:",JSON.stringify(t,null,2));let n=document.getElementById("modal-order-status"),d=V(t.status);n.textContent=d.label,n.className=`ml-2 ${d.classes}`;let i=t.buyer_details;if(typeof i=="string")try{i=JSON.parse(i)}catch{i={}}i=i||{};let s=t.items;if(typeof s=="string")try{s=JSON.parse(s)}catch{s=[]}s=s||[];let h=t.expand?.user,b=i.customer||{},c=i.shipping_info||{},_=b.fullName||c.receiver||h?.name||"-",l=b.phoneNumber||c.phone||h?.phone||"-",C=b.email||h?.email||"-",$="-";c.address&&($=`(${c.postcode||""}) ${c.address} ${c.detailAddress||""} ${c.extraAddress||""}`.trim()),document.getElementById("modal-payment-id").textContent=t.payment_id||t.id,document.getElementById("modal-buyer-name").textContent=_,document.getElementById("modal-buyer-phone").textContent=l,document.getElementById("modal-buyer-email").textContent=C,document.getElementById("modal-buyer-address").textContent=$,document.getElementById("modal-buyer-delivery-note").textContent=c.deliveryNote||"-",document.getElementById("modal-total-amount").textContent=(t.total_amount||0).toLocaleString()+"\uC6D0";let S=new Date(t.created).toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});document.getElementById("modal-order-date").textContent=S;let H=document.getElementById("modal-order-items"),M="";if(s&&s.length>0)for(let m of s){console.log("Processing Order Item:",m);let I=m.name||m.title||m.productName||m.product_name,P=m.price||m.discount_price||0,R=m.quantity||m.qty||1,x=m.product_id||m.productId||m.product||m.id;typeof x=="object"&&x!==null&&(x=x.id),console.log("Resolved Product ID:",x);let k=m.image?m.image.trim():"";if((!I||!k||!k.startsWith("http")&&!k.startsWith("data:"))&&x)try{let v=null;try{v=await o.collection("products").getOne(x),console.log("Fetched product by ID:",v)}catch{}if(!v)try{v=await o.collection("products").getFirstListItem(`slug="${x}"`),console.log("Fetched product by Slug:",v)}catch{}if(v&&(I||(I=v.name),(!k||!k.startsWith("http")&&!k.startsWith("data:"))&&v.images&&v.images.length>0)){let ne=v.images[0];k=o.files.getUrl(v,ne,{thumb:"100x100"})}}catch(v){console.warn("Failed to fetch product info for:",x,v)}I||(I=`\uC0C1\uD488\uBA85 \uC5C6\uC74C (${x||"ID \uC5C6\uC74C"})`),(!k||!k.startsWith("http")&&!k.startsWith("data:"))&&(k=T),M+=`
                    <div class="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center">
                        <div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                             <img src="${k}" 
                                  class="h-full w-full object-cover" 
                                  alt="${I}"
                                  loading="lazy"
                                  data-fallback-src="${J}">
                        </div>
                        <div class="min-w-0 flex-1">
                            <h6 class="mb-1 break-words text-sm font-semibold text-slate-900">${I}</h6>
                            <div class="break-words text-xs text-slate-500">ID: ${x||"-"}</div>
                            <div class="mt-1 text-sm text-slate-600">${P.toLocaleString()}\uC6D0 \xD7 ${R}\uAC1C</div>
                        </div>
                        <div class="whitespace-nowrap text-sm font-semibold text-slate-900">
                            ${(P*R).toLocaleString()}\uC6D0
                        </div>
                    </div>
                `}else M='<div class="px-4 py-8 text-center text-sm text-slate-500">\uC0C1\uD488 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';H.innerHTML=M,g=e;let ee=document.getElementById("tracking-carrier"),te=document.getElementById("tracking-number"),O=document.getElementById("track-delivery-btn"),N=document.getElementById("tracking-status-msg");ee.value=t.tracking_carrier||"",te.value=t.tracking_number||"",t.tracking_carrier&&t.tracking_number?(O.classList.remove("hidden"),N.textContent="\uC6B4\uC1A1\uC7A5\uC774 \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",N.className="mt-2 text-sm text-emerald-600"):(O.classList.add("hidden"),N.textContent="",N.className="mt-2 text-sm text-slate-500"),Oe(H),Y("order-detail-modal")}function D(){L("order-detail-modal"),g=null}async function ce(){if(!g){p("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}let e=document.getElementById("tracking-carrier").value,t=document.getElementById("tracking-number").value.trim(),n=document.getElementById("tracking-status-msg"),d=document.getElementById("track-delivery-btn");if(!e||!t){n.textContent="\uD0DD\uBC30\uC0AC\uC640 \uC6B4\uC1A1\uC7A5\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694.",n.className="mt-2 text-sm text-rose-600";return}try{n.textContent="\uC800\uC7A5 \uC911...",n.className="mt-2 text-sm text-slate-500";let i=a.find(_=>_.id===g),s=i.status==="paid"?"shipping":i.status;await o.collection("orders").update(g,{tracking_carrier:e,tracking_number:t,status:s});let h=a.findIndex(_=>_.id===g);h!==-1&&(a[h].tracking_carrier=e,a[h].tracking_number=t,a[h].status=s),n.textContent="\uC6B4\uC1A1\uC7A5\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!",n.className="mt-2 text-sm text-emerald-600",d.classList.remove("hidden");let b=document.getElementById("modal-order-status"),c=V(s);b.textContent=c.label,b.className=`ml-2 ${c.classes}`,B()}catch(i){console.error("Failed to save tracking info:",i),n.textContent="\uC800\uC7A5 \uC2E4\uD328: "+i.message,n.className="mt-2 text-sm text-rose-600"}}function me(){let e=document.getElementById("tracking-carrier").value,t=document.getElementById("tracking-number").value.trim();if(!e||!t||!A[e]){p("\uD0DD\uBC30\uC0AC \uB610\uB294 \uC6B4\uC1A1\uC7A5\uBC88\uD638\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}let n=A[e].trackUrl+t;open(n,"_blank")}function ue(e,t=null){t===null?r.has(e)?r.delete(e):r.add(e):t?r.add(e):r.delete(e),X(),Q()}function fe(){let e=document.getElementById("select-all-orders"),t=document.getElementById("status-filter"),n=t?t.value:"";if(!e)return;let d=a;n&&(d=a.filter(b=>b.status===n));let i=(u-1)*20,s=i+20,h=d.slice(i,s);e.checked?h.forEach(b=>r.add(b.id)):h.forEach(b=>r.delete(b.id)),B()}function Q(){let e=document.getElementById("select-all-orders");if(!e)return;let t=document.querySelectorAll(".order-checkbox"),n=t.length>0&&Array.from(t).every(i=>i.checked),d=t.length>0&&Array.from(t).some(i=>i.checked);e.checked=n,e.indeterminate=d&&!n}function X(){let e=document.getElementById("bulk-actions"),t=document.getElementById("selected-count");!e||!t||(r.size>0?(e.classList.remove("hidden"),t.textContent=r.size):e.classList.add("hidden"))}async function ge(e=null){let t=e||g;if(!t){p("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}try{await o.collection("orders").update(t,{status:"archived"});let n=a.findIndex(d=>d.id===t);n!==-1&&(a[n].status="archived"),p("\uC8FC\uBB38\uC774 \uBCF4\uAD00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.","success"),D(),B()}catch(n){console.error("Failed to archive order:",n),p("\uBCF4\uAD00 \uC2E4\uD328: "+n.message,"error")}}async function be(){if(r.size===0){p("\uC120\uD0DD\uB41C \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}if(await we({title:"\uC8FC\uBB38 \uC77C\uAD04 \uBCF4\uAD00",message:`${r.size}\uAC1C\uC758 \uC8FC\uBB38\uC744 \uBCF4\uAD00\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`,confirmLabel:"\uBCF4\uAD00"}))try{let t=Array.from(r).map(n=>o.collection("orders").update(n,{status:"archived"}));await Promise.all(t),r.forEach(n=>{let d=a.findIndex(i=>i.id===n);d!==-1&&(a[d].status="archived")}),p(`${r.size}\uAC1C\uC758 \uC8FC\uBB38\uC774 \uBCF4\uAD00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,"success"),r.clear(),B()}catch(t){console.error("Failed to bulk archive:",t),p("\uC77C\uAD04 \uBCF4\uAD00 \uC2E4\uD328: "+t.message,"error")}}function pe(e=null){if(y=e||g,!y){p("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}let t=a.find(n=>n.id===y);if(t){let n=document.getElementById("delete-order-info");n.textContent=`\uC8FC\uBB38\uBC88\uD638: ${t.payment_id||t.id.substring(0,8)}`}Y("delete-confirm-modal")}async function Z(){if(!y){p("\uC0AD\uC81C\uD560 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}try{await o.collection("orders").delete(y),a=a.filter(e=>e.id!==y),r.delete(y),L("delete-confirm-modal"),D(),p("\uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.","success"),document.getElementById("total-orders-count").textContent=a.length,B()}catch(e){console.error("Failed to delete order:",e),p("\uC0AD\uC81C \uC2E4\uD328: "+e.message,"error")}finally{y=null}}async function he(){if(r.size===0){p("\uC120\uD0DD\uB41C \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}let e=document.getElementById("delete-order-info");e.textContent=`\uC120\uD0DD\uB41C ${r.size}\uAC1C\uC758 \uC8FC\uBB38\uC744 \uC0AD\uC81C\uD569\uB2C8\uB2E4.`,y="BULK_DELETE",Y("delete-confirm-modal")}return Z=async function(){if(y==="BULK_DELETE")try{let e=Array.from(r).map(n=>o.collection("orders").delete(n));await Promise.all(e),a=a.filter(n=>!r.has(n.id));let t=r.size;r.clear(),L("delete-confirm-modal"),p(`${t}\uAC1C\uC758 \uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,"success"),document.getElementById("total-orders-count").textContent=a.length,B()}catch(e){console.error("Failed to bulk delete:",e),p("\uC77C\uAD04 \uC0AD\uC81C \uC2E4\uD328: "+e.message,"error")}finally{y=null}else{if(!y){p("\uC0AD\uC81C\uD560 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.","error");return}try{await o.collection("orders").delete(y),a=a.filter(e=>e.id!==y),r.delete(y),L("delete-confirm-modal"),D(),p("\uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.","success"),document.getElementById("total-orders-count").textContent=a.length,B()}catch(e){console.error("Failed to delete order:",e),p("\uC0AD\uC81C \uC2E4\uD328: "+e.message,"error")}finally{y=null}}},{init:Le,openModal:G,closeModal:D,setPage:le,saveTrackingInfo:ce,openTrackingUrl:me,toggleSelectOrder:ue,toggleSelectAll:fe,archiveOrder:ge,bulkArchive:be,confirmDelete:pe,deleteOrder:Z,bulkDelete:he}})();document.addEventListener("DOMContentLoaded",()=>{qe.init()});})();
