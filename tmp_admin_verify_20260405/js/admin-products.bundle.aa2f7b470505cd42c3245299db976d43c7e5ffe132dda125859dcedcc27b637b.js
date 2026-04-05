(()=>{var y=new Map;function j(e){if(y.has(e))return y.get(e);let t=document.getElementById(e);if(!t)return y.set(e,{}),{};try{let n=JSON.parse(t.textContent||"{}");return y.set(e,n),n}catch(n){return console.warn(`Failed to parse runtime config: ${e}`,n),y.set(e,{}),{}}}function Y(){return j("site-config")}function w(){return Y().pocketbaseUrl||"http://127.0.0.1:8090"}var C=null,H=()=>w();function T(){return C||(C=new PocketBase(H()),console.log("[PBClient] PocketBase instance created:",H())),C}var te=T();var $=null;function A(){return $||($=T()),$}function D(){let e=A();return!e||!e.authStore.isValid||!e.authStore.isAdmin?(sessionStorage.setItem("adminRedirectUrl",location.href),location.href="/ko/admin/login",!1):!0}var z="admin-feedback-style",B="admin-feedback-root",E="admin-feedback-dialog",u=null;function q(){if(document.getElementById(z))return;let e=document.createElement("style");e.id=z,e.textContent=`
        #${B} {
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

        #${E}[hidden] {
            display: none !important;
        }

        #${E} {
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
            #${B} {
                right: 0.75rem;
                left: 0.75rem;
                width: auto;
            }

            #${E} {
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
    `,document.head.appendChild(e)}function K(){let e=document.getElementById(B);return e||(e=document.createElement("div"),e.id=B,e.setAttribute("aria-live","polite"),e.setAttribute("aria-atomic","true"),document.body.appendChild(e)),e}function Q(){let e=document.getElementById(E);return e||(e=document.createElement("div"),e.id=E,e.hidden=!0,e.innerHTML=`
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
    `,document.body.appendChild(e),e.querySelector("[data-admin-feedback-backdrop]").addEventListener("click",function(){v(u?.kind==="prompt"?null:!1)}),e.querySelector("[data-admin-feedback-cancel]").addEventListener("click",function(){v(u?.kind==="prompt"?null:!1)}),e.querySelector("[data-admin-feedback-confirm]").addEventListener("click",function(){if(u){if(u.kind==="prompt"){let t=e.querySelector("#admin-feedback-dialog-input"),n=e.querySelector("#admin-feedback-dialog-error"),o=t.value.trim(),i=typeof u.validate=="function"?u.validate(o):"";if(i){n.textContent=i,t.focus();return}v(o);return}v(!0)}}),document.addEventListener("keydown",function(t){t.key!=="Escape"||!u||v(u.kind==="prompt"?null:!1)}),e)}function v(e){if(!u)return;let{resolve:t,dialog:n,previousOverflow:o,previousActiveElement:i}=u;n.hidden=!0,u=null,document.body.style.overflow=o||"",i&&typeof i.focus=="function"&&i.focus(),t(e)}function W(e,t={}){q();let n=Q(),o=n.querySelector("#admin-feedback-dialog-title"),i=n.querySelector("#admin-feedback-dialog-message"),d=n.querySelector("#admin-feedback-dialog-input"),r=n.querySelector("#admin-feedback-dialog-error"),a=n.querySelector("[data-admin-feedback-cancel]"),l=n.querySelector("[data-admin-feedback-confirm]");o.textContent=t.title||"",i.textContent=t.message||"",r.textContent="",a.textContent=t.cancelLabel||"\uCDE8\uC18C",l.textContent=t.confirmLabel||"\uD655\uC778",l.classList.toggle("admin-feedback-dialog__button--danger",!!t.danger),e==="prompt"?(d.hidden=!1,d.placeholder=t.placeholder||"",d.value=t.initialValue||""):(d.hidden=!0,d.placeholder="",d.value="");let m=document.body.style.overflow,p=document.activeElement;return n.hidden=!1,document.body.style.overflow="hidden",new Promise(g=>{u={kind:e,resolve:g,dialog:n,previousOverflow:m,previousActiveElement:p,validate:t.validate},setTimeout(function(){e==="prompt"?(d.focus(),d.select()):l.focus()},0)})}function F(e,t={}){q();let n=K(),o=document.createElement("div"),i=t.type||"info",d=t.duration||(i==="error"?4200:2800);o.className=`admin-feedback-toast admin-feedback-toast--${i}`,o.textContent=e,n.appendChild(o),requestAnimationFrame(function(){o.classList.add("is-visible")}),setTimeout(function(){o.classList.remove("is-visible"),setTimeout(function(){o.remove()},180)},d)}function U(e={}){return W("confirm",e)}function f(e,t="info",n){F(e,{type:t,duration:n})}function G(e){return U(e)}var P={pb:null,categories:[],modal:null,_currentTrigger:null,_previousBodyOverflow:"",_escapeHandlerBound:!1,init:async function(e){this.pb=e,this.modal=document.getElementById("categoryModal");let t=document.getElementById("category-form");t&&t.addEventListener("submit",o=>{o.preventDefault(),this.addCategory()});let n=document.getElementById("category-list");n&&!n.dataset.bound&&(n.dataset.bound="true",n.addEventListener("click",o=>{let i=o.target.closest('[data-action="delete-category"]');i&&this.deleteCategory(i.dataset.categoryId)})),this.bindModalEvents(),await this.loadCategories()},bindModalEvents:function(){let e=this.modal||document.getElementById("categoryModal");!e||e.dataset.bound||(this.modal=e,e.dataset.bound="true",e.addEventListener("click",t=>{(t.target===e||t.target.closest("[data-category-modal-close]"))&&this.closeModal()}),this._escapeHandlerBound||(document.addEventListener("keydown",t=>{t.key==="Escape"&&this.isOpen()&&this.closeModal()}),this._escapeHandlerBound=!0))},isOpen:function(){return!!(this.modal&&!this.modal.hidden)},loadCategories:async function(){try{this.categories=await this.pb.collection("categories").getFullList({sort:"name"}),this.renderList(),this.updateDropdowns()}catch(e){if(console.error("Error loading categories:",e),e.status===404){let t=document.getElementById("category-list");t&&(t.innerHTML='<div class="admin-category-state admin-category-state--error">\uCE74\uD14C\uACE0\uB9AC \uCEEC\uB809\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>')}}},renderList:function(){let e=document.getElementById("category-list");if(e){if(this.categories.length===0){e.innerHTML='<div class="admin-category-state">\uCE74\uD14C\uACE0\uB9AC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';return}e.innerHTML="",this.categories.forEach(t=>{let n=document.createElement("div");n.className="admin-category-item",n.innerHTML=`
                <span class="admin-category-item__name">${t.name}</span>
                <button class="admin-category-item__delete" type="button" data-action="delete-category" data-category-id="${t.id}">
                    &times;
                </button>
            `,e.appendChild(n)})}},updateDropdowns:function(){document.querySelectorAll("#product-category, #filter-category").forEach(t=>{let n=t.value,o=t.id==="filter-category";t.innerHTML=o?'<option value="">\uBAA8\uB4E0 \uCE74\uD14C\uACE0\uB9AC</option>':'<option value="">\uCE74\uD14C\uACE0\uB9AC \uC120\uD0DD</option>',this.categories.forEach(i=>{let d=document.createElement("option");d.value=i.id,d.textContent=i.name,t.appendChild(d)}),n&&(t.value=n)})},addCategory:async function(){let e=document.getElementById("new-category-name"),t=e.value.trim();if(!t)return;let n=t.toLowerCase().replace(/\s+/g,"-").replace(/[^\w\-가-힣]/g,"").replace(/^-|-$/g,"");try{await this.pb.collection("categories").create({name:t,slug:n||"cat-"+Date.now()}),e.value="",await this.loadCategories()}catch(o){console.error("Error creating category:",o),f("\uCE74\uD14C\uACE0\uB9AC \uCD94\uAC00 \uC2E4\uD328: "+o.message,"error")}},deleteCategory:async function(e){if(await G({title:"\uCE74\uD14C\uACE0\uB9AC \uC0AD\uC81C",message:"\uC815\uB9D0 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",confirmLabel:"\uC0AD\uC81C",danger:!0}))try{await this.pb.collection("categories").delete(e),await this.loadCategories()}catch(n){console.error("Error deleting category:",n),f("\uCE74\uD14C\uACE0\uB9AC \uC0AD\uC81C \uC2E4\uD328","error")}},openModal:function(e){let t=this.modal||document.getElementById("categoryModal");if(!t)return;this.modal=t,this._previousBodyOverflow=document.body.style.overflow,this._currentTrigger=e&&typeof e.focus=="function"?e:document.activeElement&&typeof document.activeElement.focus=="function"?document.activeElement:null,t.hidden=!1,t.setAttribute("aria-hidden","false"),document.body.style.overflow="hidden";let n=document.getElementById("new-category-name");n&&setTimeout(()=>n.focus(),0)},closeModal:function(){let e=this.modal||document.getElementById("categoryModal");e&&(e.hidden=!0,e.setAttribute("aria-hidden","true"),document.body.style.overflow=this._previousBodyOverflow||"",this._currentTrigger&&this._currentTrigger.focus(),this._currentTrigger=null)}},X={pb:null,currentProduct:null,visualItems:[],sortable:null,_slugGenerator:null,modal:null,_currentTrigger:null,_previousBodyOverflow:"",_escapeHandlerBound:!1,init:async function(){this.pb=A(),D()&&(await P.init(this.pb),this.bindEvents(),this.bindModalEvents(),document.body.addEventListener("htmx:configRequest",e=>{this.pb&&this.pb.authStore.isValid&&(e.detail.headers.Authorization=this.pb.authStore.token)}),this.loadProducts())},bindEvents:function(){let e=document.getElementById("add-product-btn");e&&!e.dataset.bound&&(e.dataset.bound="true",e.addEventListener("click",r=>this.openAddModal(r.currentTarget)));let t=document.getElementById("manage-categories-btn");t&&!t.dataset.bound&&(t.dataset.bound="true",t.addEventListener("click",r=>P.openModal(r.currentTarget)));let n=document.getElementById("filter-category");n&&!n.dataset.bound&&(n.dataset.bound="true",n.addEventListener("change",()=>this.loadProducts()));let o=document.getElementById("product-images");o&&!o.dataset.bound&&(o.dataset.bound="true",o.addEventListener("change",r=>this.handleImageSelect(r.target)));let i=document.getElementById("product-form");i&&!i.dataset.bound&&(i.dataset.bound="true",i.addEventListener("submit",r=>{r.preventDefault(),this.saveProduct()}));let d=document.getElementById("product-table-body");d&&!d.dataset.bound&&(d.dataset.bound="true",d.addEventListener("click",r=>{let a=r.target.closest("[data-action]");if(!a)return;let{action:l,productId:m}=a.dataset;l==="edit-product"?this.openEditModal(m,a):l==="delete-product"&&this.deleteProduct(m)}),d.addEventListener("change",r=>{let a=r.target.closest('[data-action="product-category-select"]');a&&this.updateCategory(a.dataset.productId,a.value)}))},bindModalEvents:function(){let e=this.modal||document.getElementById("productModal");!e||e.dataset.bound||(this.modal=e,e.dataset.bound="true",e.addEventListener("click",t=>{(t.target===e||t.target.closest("[data-product-modal-close]"))&&this.closeModal()}),this._escapeHandlerBound||(document.addEventListener("keydown",t=>{t.key==="Escape"&&this.isModalOpen()&&this.closeModal()}),this._escapeHandlerBound=!0))},isModalOpen:function(){return!!(this.modal&&!this.modal.hidden)},openModal:function(){let e=this.modal||document.getElementById("productModal");e&&(this.modal=e,this._previousBodyOverflow=document.body.style.overflow,e.hidden=!1,e.setAttribute("aria-hidden","false"),document.body.style.overflow="hidden",setTimeout(()=>{let t=document.getElementById("product-title")||e.querySelector("input, textarea, select");t&&typeof t.focus=="function"&&t.focus()},0))},closeModal:function(){let e=this.modal||document.getElementById("productModal");e&&(e.hidden=!0,e.setAttribute("aria-hidden","true"),document.body.style.overflow=this._previousBodyOverflow||"",this._currentTrigger&&typeof this._currentTrigger.focus=="function"&&this._currentTrigger.focus(),this._currentTrigger=null)},loadProducts:async function(){let e=document.getElementById("product-table-body"),t=document.getElementById("loading-spinner");t.style.display="flex",e.innerHTML="";try{let n=document.getElementById("filter-category").value,o=await this.pb.collection("products").getFullList({sort:"-created",expand:"category"});t.style.display="none";let i=o;if(n&&(i=o.filter(a=>a.category===n)),i.length===0){e.innerHTML='<tr><td colspan="9" class="admin-empty-state">\uB4F1\uB85D\uB41C \uC0C1\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</td></tr>';return}let d=await this.pb.collection("product_inquiries").getFullList({fields:"product_id,reply",sort:"-created"}),r={};d.forEach(a=>{r[a.product_id]||(r[a.product_id]={total:0,waiting:0}),r[a.product_id].total++,a.reply||r[a.product_id].waiting++}),i.forEach(a=>{let l=document.createElement("tr"),m=a.images&&a.images.length>0?this.pb.files.getUrl(a,a.images[0],{thumb:"100x100"}):"",p=`<select class="admin-select admin-category-select" data-action="product-category-select" data-product-id="${a.id}">
                    <option value="">(\uBBF8\uC9C0\uC815)</option>`;P.categories.forEach(b=>{let x=a.category===b.id?"selected":"";p+=`<option value="${b.id}" ${x}>${b.name}</option>`}),p+="</select>";let g=r[a.id]||{total:0,waiting:0},h="-";g.total>0&&(h=`<span class="${g.waiting>0?"admin-pill admin-pill--warning":"admin-pill admin-pill--muted"}" title="\uBB38\uC758 ${g.total}\uAC74 (\uB2F5\uBCC0\uB300\uAE30 ${g.waiting})">
                        <i class="tf-ion-chatbubbles"></i> ${g.waiting>0?g.waiting:g.total}
                    </span>`);let _=m?`<div class="admin-table-thumb"><img src="${m}" alt="${a.title}"></div>`:'<div class="admin-table-thumb admin-table-thumb--empty">-</div>';l.innerHTML=`
                    <td>
                        ${_}
                    </td>
                    <td>${p}</td>
                    <td class="admin-product-title">${a.title}</td>
                    <td>${a.discount_price&&a.discount_price>0?`<del style="color: #64748b; font-size: 0.85rem;">${a.price.toLocaleString()}</del> <br><span style="color: #b91c1c; font-weight: 700;">${a.discount_price.toLocaleString()}</span>`:a.price.toLocaleString()}</td>
                    <td>${a.stock||0}</td>
                    <td style="text-align: center;">${h}</td>
                    <td>
                        <div class="admin-switch">
                            <input type="checkbox" class="admin-switch__input" id="status-${a.id}" 
                                ${a.enabled?"checked":""}
                                hx-patch="${w()}/api/collections/products/records/${a.id}"
                                hx-trigger="change"
                                hx-vals='js:{"enabled": event.target.checked}'
                                hx-swap="none">
                            <label class="admin-switch__track" for="status-${a.id}">
                                <span class="admin-switch__thumb"></span>
                            </label>
                        </div>
                    </td>
                    <td>
                        <div class="admin-table-actions">
                            <button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-action="edit-product" data-product-id="${a.id}">\uC218\uC815</button>
                            <button class="admin-btn admin-btn--danger admin-btn--sm" type="button" data-action="delete-product" data-product-id="${a.id}">\uC0AD\uC81C</button>
                            <a href="/${a.language||"ko"}/products/${a.slug}/" target="_blank" rel="noreferrer" class="admin-btn admin-btn--light admin-btn--sm">\uC0C1\uC138\uD398\uC774\uC9C0</a>
                        </div>
                    </td>
                `,e.appendChild(l),htmx.process(l)})}catch(n){console.error("Error loading products:",n),t.style.display="none",f("\uC0C1\uD488 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4","error")}},openAddModal:function(e){this.currentProduct=null,document.getElementById("product-form").reset(),document.getElementById("product-id").value="",document.getElementById("product-category").value="",document.getElementById("productModalLabel").innerText="\uC0C1\uD488 \uCD94\uAC00",document.getElementById("product-stock").value="0",document.getElementById("product-admin-memo").value="",this._currentTrigger=e||document.getElementById("add-product-btn")||document.activeElement,this.visualItems=[],this.renderImages(),this.bindSlugGenerator(),this.openModal()},openEditModal:async function(e,t){try{let n=await this.pb.collection("products").getOne(e);this.currentProduct=n,this._currentTrigger=t||document.activeElement,document.getElementById("product-id").value=n.id,document.getElementById("product-title").value=n.title,document.getElementById("product-category").value=n.category||"",document.getElementById("product-slug").value=n.slug,document.getElementById("product-description").value=n.description,document.getElementById("product-admin-memo").value=n.admin_memo||"",document.getElementById("product-price").value=n.price,document.getElementById("product-discount").value=n.discount_price,document.getElementById("product-stock").value=n.stock||0,document.getElementById("product-order").value=n.order,document.getElementById("product-enabled").checked=n.enabled,document.getElementById("product-language").value=n.language,this.detachSlugGenerator();let o=n.colors?Array.isArray(n.colors)?n.colors:JSON.parse(n.colors):[],i=n.sizes?Array.isArray(n.sizes)?n.sizes:JSON.parse(n.sizes):[];document.getElementById("product-colors").value=o.join(", "),document.getElementById("product-sizes").value=i.join(", "),this.visualItems=[],n.images&&n.images.length>0&&n.images.forEach(d=>{this.visualItems.push({type:"existing",value:d,id:"exist-"+d})}),this.renderImages(),document.getElementById("productModalLabel").innerText="\uC0C1\uD488 \uC218\uC815",this.openModal()}catch(n){console.error("Error fetching product details:",n),f("\uC0C1\uD488 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4","error")}},bindSlugGenerator:function(){let e=document.getElementById("product-title"),t=document.getElementById("product-slug");!e||!t||(this.detachSlugGenerator(),this._slugGenerator=()=>{let o=e.value.toLowerCase().trim().replace(/\s+/g,"-").replace(/[^\w\-가-힣]/g,"").replace(/[가-힣]/g,function(){return""}).replace(/\-+/g,"-").replace(/^-|-$/g,"");o||(o="product-"+Date.now()),t.value=o},e.addEventListener("input",this._slugGenerator))},detachSlugGenerator:function(){let e=document.getElementById("product-title");e&&this._slugGenerator&&e.removeEventListener("input",this._slugGenerator),this._slugGenerator=null},saveProduct:async function(){let e=document.getElementById("product-id").value,t=document.getElementById("product-title").value,n=document.getElementById("product-category").value,o=document.getElementById("product-slug").value,i=document.getElementById("product-description").value,d=document.getElementById("product-admin-memo").value,r=parseFloat(document.getElementById("product-price").value),a=document.getElementById("product-discount").value,l=document.getElementById("product-stock").value,m=document.getElementById("product-order").value,p=document.getElementById("product-enabled").checked,g=document.getElementById("product-language").value,h=document.getElementById("product-colors").value,_=document.getElementById("product-sizes").value,b=h?h.split(",").map(c=>c.trim()).filter(c=>c):[],x=_?_.split(",").map(c=>c.trim()).filter(c=>c):[],L=this.visualItems.filter(c=>c.type==="new").map(c=>c.value),N=this.visualItems.filter(c=>c.type==="existing").map(c=>c.value),s=new FormData;if(s.append("title",t),n&&s.append("category",n),s.append("slug",o),s.append("description",i||""),s.append("admin_memo",d||""),s.append("price",r),a&&a.trim()!==""&&s.append("discount_price",parseFloat(a)),l&&l.trim()!==""?s.append("stock",parseInt(l)):s.append("stock",0),m&&m.trim()!==""?s.append("order",parseInt(m)):s.append("order",0),s.append("enabled",p),s.append("language",g),s.append("colors",JSON.stringify(b)),s.append("sizes",JSON.stringify(x)),L.length>0)for(let c of L)s.append("images",c);e&&N.forEach(c=>{s.append("images",c)});try{let c;e?c=await this.pb.collection("products").update(e,s):c=await this.pb.collection("products").create(s);let k=[],S=c.images?[...c.images]:[],J=L.length,O=S.slice(S.length-J),M=0;this.visualItems.forEach(I=>{I.type==="existing"?S.includes(I.value)&&k.push(I.value):I.type==="new"&&M<O.length&&(k.push(O[M]),M++)});let R=JSON.stringify(c.images),V=JSON.stringify(k);R!==V&&await this.pb.collection("products").update(c.id,{images:k}),this.closeModal(),this.loadProducts()}catch(c){console.error("Error saving product:",c),f("\uC0C1\uD488 \uC800\uC7A5 \uC2E4\uD328: "+c.message,"error",4200)}},deleteProduct:async function(e){if(await G({title:"\uC0C1\uD488 \uC0AD\uC81C",message:"\uC774 \uC0C1\uD488\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",confirmLabel:"\uC0AD\uC81C",danger:!0}))try{await this.pb.collection("products").delete(e),this.loadProducts()}catch(n){console.error("Error deleting product:",n),f("\uC0C1\uD488 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4","error")}},deleteImage:function(e){this.visualItems.splice(e,1),this.renderImages()},updateCategory:async function(e,t){try{await this.pb.collection("products").update(e,{category:t}),console.log("Category updated")}catch(n){console.error("Error updating category:",n),f("\uCE74\uD14C\uACE0\uB9AC \uC218\uC815 \uC2E4\uD328: "+n.message,"error"),this.loadProducts()}},handleImageSelect:function(e){e.files&&e.files.length>0&&(Array.from(e.files).forEach((t,n)=>{this.visualItems.some(i=>i.type==="new"&&i.value.name===t.name&&i.value.size===t.size)||this.visualItems.push({type:"new",value:t,id:"new-"+Date.now()+"-"+n})}),this.renderImages(),e.value="")},renderImages:function(){let e=document.getElementById("product-image-list");if(e){if(this.visualItems.length===0){e.innerHTML='<div class="admin-product-image-empty admin-empty-state">\uC774\uBBF8\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4</div>';return}e.innerHTML="",this.sortable||(this.sortable=new Sortable(e,{animation:150,onEnd:t=>{let n=this.visualItems.splice(t.oldIndex,1)[0];this.visualItems.splice(t.newIndex,0,n)}})),this.visualItems.forEach((t,n)=>{let o=document.createElement("div");o.className="admin-sortable-item",o.setAttribute("data-id",t.id);let i="";if(t.type==="existing")i=`<img src="${this.pb.files.getUrl(this.currentProduct,t.value,{thumb:"100x100"})}" alt="" />`,o.innerHTML=`
                    <div class="admin-sortable-thumb">
                        ${i}
                    </div>
                `;else{o.innerHTML=`
                    <div class="admin-sortable-thumb admin-sortable-thumb--loading">
                         <div class="admin-spinner" aria-hidden="true" style="width: 1rem; height: 1rem;"></div>
                    </div>
                `;let r=new FileReader;r.onload=a=>{let l=o.querySelector(".admin-sortable-thumb");l.style.background="none",l.innerHTML=`<img src="${a.target.result}" alt="" />`},r.readAsDataURL(t.value)}let d=document.createElement("button");if(d.type="button",d.className="admin-btn admin-btn--danger admin-btn--sm admin-sortable-remove",d.innerHTML="&times;",d.addEventListener("click",r=>{r.stopPropagation(),this.deleteImage(n)}),o.appendChild(d),n===0){let r=document.createElement("span");r.className="admin-pill admin-pill--success admin-sortable-badge",r.textContent="\uB300\uD45C",o.appendChild(r)}e.appendChild(o)})}}};document.addEventListener("DOMContentLoaded",function(){X.init()});})();
