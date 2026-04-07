(()=>{var p=new Map;function $(e,o){if(e&&typeof e=="object"&&!Array.isArray(e))return e;if(typeof e=="string")try{let t=JSON.parse(e);if(t&&typeof t=="object"&&!Array.isArray(t))return t}catch(t){console.warn(`Failed to parse nested runtime config: ${o}`,t)}return{}}function C(e){if(p.has(e))return p.get(e);let o=document.getElementById(e);if(!o)return p.set(e,{}),{};try{let t=JSON.parse(o.textContent||"{}"),n=$(t,e);return p.set(e,n),n}catch(t){return console.warn(`Failed to parse runtime config: ${e}`,t),p.set(e,{}),{}}}function U(){return C("site-config")}function w(){return U().pocketbaseUrl||"http://127.0.0.1:8090"}var v=null,B=()=>w();function k(){return v||(v=new PocketBase(B()),console.log("[PBClient] PocketBase instance created:",B())),v}var z=k();var E=null;function _(){return E||(E=k()),E}function S(){let e=_();return!e||!e.authStore.isValid||!e.authStore.isAdmin?(sessionStorage.setItem("adminRedirectUrl",location.href),location.href="/ko/admin/login",!1):!0}var M="admin-feedback-style",h="admin-feedback-root",b="admin-feedback-dialog",l=null;function A(){if(document.getElementById(M))return;let e=document.createElement("style");e.id=M,e.textContent=`
        #${h} {
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

        #${b}[hidden] {
            display: none !important;
        }

        #${b} {
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
            #${h} {
                right: 0.75rem;
                left: 0.75rem;
                width: auto;
            }

            #${b} {
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
    `,document.head.appendChild(e)}function q(){let e=document.getElementById(h);return e||(e=document.createElement("div"),e.id=h,e.setAttribute("aria-live","polite"),e.setAttribute("aria-atomic","true"),document.body.appendChild(e)),e}function O(){let e=document.getElementById(b);return e||(e=document.createElement("div"),e.id=b,e.hidden=!0,e.innerHTML=`
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
    `,document.body.appendChild(e),e.querySelector("[data-admin-feedback-backdrop]").addEventListener("click",function(){g(l?.kind==="prompt"?null:!1)}),e.querySelector("[data-admin-feedback-cancel]").addEventListener("click",function(){g(l?.kind==="prompt"?null:!1)}),e.querySelector("[data-admin-feedback-confirm]").addEventListener("click",function(){if(l){if(l.kind==="prompt"){let o=e.querySelector("#admin-feedback-dialog-input"),t=e.querySelector("#admin-feedback-dialog-error"),n=o.value.trim(),i=typeof l.validate=="function"?l.validate(n):"";if(i){t.textContent=i,o.focus();return}g(n);return}g(!0)}}),document.addEventListener("keydown",function(o){o.key!=="Escape"||!l||g(l.kind==="prompt"?null:!1)}),e)}function g(e){if(!l)return;let{resolve:o,dialog:t,previousOverflow:n,previousActiveElement:i}=l;t.hidden=!0,l=null,document.body.style.overflow=n||"",i&&typeof i.focus=="function"&&i.focus(),o(e)}function L(e,o={}){A();let t=O(),n=t.querySelector("#admin-feedback-dialog-title"),i=t.querySelector("#admin-feedback-dialog-message"),a=t.querySelector("#admin-feedback-dialog-input"),r=t.querySelector("#admin-feedback-dialog-error"),u=t.querySelector("[data-admin-feedback-cancel]"),c=t.querySelector("[data-admin-feedback-confirm]");n.textContent=o.title||"",i.textContent=o.message||"",r.textContent="",u.textContent=o.cancelLabel||"\uCDE8\uC18C",c.textContent=o.confirmLabel||"\uD655\uC778",c.classList.toggle("admin-feedback-dialog__button--danger",!!o.danger),e==="prompt"?(a.hidden=!1,a.placeholder=o.placeholder||"",a.value=o.initialValue||""):(a.hidden=!0,a.placeholder="",a.value="");let s=document.body.style.overflow,d=document.activeElement;return t.hidden=!1,document.body.style.overflow="hidden",new Promise(f=>{l={kind:e,resolve:f,dialog:t,previousOverflow:s,previousActiveElement:d,validate:o.validate},setTimeout(function(){e==="prompt"?(a.focus(),a.select()):c.focus()},0)})}function T(e,o={}){A();let t=q(),n=document.createElement("div"),i=o.type||"info",a=o.duration||(i==="error"?4200:2800);n.className=`admin-feedback-toast admin-feedback-toast--${i}`,n.textContent=e,t.appendChild(n),requestAnimationFrame(function(){n.classList.add("is-visible")}),setTimeout(function(){n.classList.remove("is-visible"),setTimeout(function(){n.remove()},180)},a)}function D(e={}){return L("confirm",e)}function P(e={}){return L("prompt",e)}function m(e,o="info",t){T(e,{type:o,duration:t})}function V(e){return D(e)}function H(e){return P(e)}var x={pb:null,currentPost:null,imageToUpload:null,existingImage:null,easyMDE:null,modal:null,_currentTrigger:null,_previousBodyOverflow:"",_escapeHandlerBound:!1,init:async function(){if(this.pb=_(),!S())return;document.body.addEventListener("htmx:configRequest",o=>{this.pb&&this.pb.authStore.isValid&&(o.detail.headers.Authorization=this.pb.authStore.token)}),this.bindEvents(),this.bindModalEvents(),this.loadPosts();let e=document.getElementById("post-title");e&&e.addEventListener("input",this._slugGenerator),this.easyMDE=new EasyMDE({element:document.getElementById("post-content"),autosave:{enabled:!1},spellChecker:!1,status:!1,toolbar:["bold","italic","heading","|","quote","unordered-list","ordered-list","|","link","image",{name:"video",action:o=>{x.drawVideoButton(o)},className:"fa fa-video-camera",title:"Insert Video"},"|","preview","side-by-side","fullscreen","|","guide"]})},bindEvents:function(){let e=document.getElementById("add-post-btn");e&&!e.dataset.bound&&(e.dataset.bound="true",e.addEventListener("click",a=>this.openAddModal(a.currentTarget)));let o=document.getElementById("post-form");o&&!o.dataset.bound&&(o.dataset.bound="true",o.addEventListener("submit",a=>{a.preventDefault(),this.savePost()}));let t=document.getElementById("post-image");t&&!t.dataset.bound&&(t.dataset.bound="true",t.addEventListener("change",a=>this.handleImageSelect(a.target)));let n=document.getElementById("clear-post-image-btn");n&&!n.dataset.bound&&(n.dataset.bound="true",n.addEventListener("click",()=>this.clearImage()));let i=document.getElementById("post-table-body");i&&!i.dataset.bound&&(i.dataset.bound="true",i.addEventListener("click",a=>{let r=a.target.closest("[data-action]");if(!r)return;let{action:u,postId:c}=r.dataset;u==="edit-post"?this.openEditModal(c,r):u==="delete-post"&&this.deletePost(c)}))},bindModalEvents:function(){let e=this.modal||document.getElementById("postModal");!e||e.dataset.bound||(this.modal=e,e.dataset.bound="true",e.addEventListener("click",o=>{(o.target===e||o.target.closest("[data-post-modal-close]"))&&this.closeModal()}),this._escapeHandlerBound||(document.addEventListener("keydown",o=>{o.key==="Escape"&&this.isModalOpen()&&this.closeModal()}),this._escapeHandlerBound=!0))},isModalOpen:function(){return!!(this.modal&&!this.modal.hidden)},openModal:function(){let e=this.modal||document.getElementById("postModal");e&&(this.modal=e,this._previousBodyOverflow=document.body.style.overflow,e.hidden=!1,e.setAttribute("aria-hidden","false"),document.body.style.overflow="hidden",setTimeout(()=>{this.easyMDE&&this.easyMDE.codemirror.refresh();let o=document.getElementById("post-title")||e.querySelector("input, textarea, select, button");o&&typeof o.focus=="function"&&o.focus()},0))},closeModal:function(){let e=this.modal||document.getElementById("postModal");e&&(e.hidden=!0,e.setAttribute("aria-hidden","true"),document.body.style.overflow=this._previousBodyOverflow||"",this._currentTrigger&&typeof this._currentTrigger.focus=="function"&&this._currentTrigger.focus(),this._currentTrigger=null)},loadPosts:async function(){let e=document.getElementById("post-table-body"),o=document.getElementById("loading-spinner");o.style.display="flex",e.innerHTML="";try{let t=await this.pb.collection("posts").getFullList({sort:"-created"});if(o.style.display="none",t.length===0){e.innerHTML='<tr><td colspan="5" class="admin-empty-state">\uB4F1\uB85D\uB41C \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</td></tr>';return}t.forEach(n=>{let i=document.createElement("tr"),a="";n.image&&(a=`<img src="${this.pb.files.getUrl(n,n.image,{thumb:"100x100"})}" alt="${n.title}" style="width: 100%; height: 100%; object-fit: cover;">`);let r=n.published?'<span class="admin-pill admin-pill--success">\uACF5\uAC1C</span>':'<span class="admin-pill admin-pill--muted">\uBE44\uACF5\uAC1C</span>',u=new Date(n.created).toLocaleDateString("ko-KR"),c=a?`<div class="admin-post-thumb">${a}</div>`:'<div class="admin-post-thumb admin-post-thumb--empty">-</div>';i.innerHTML=`
                    <td>
                        ${c}
                    </td>
                    <td>
                        <div class="admin-post-title">
                            <div class="admin-post-title__main">${n.title}</div>
                            <div class="admin-post-title__slug">/${n.slug}</div>
                        </div>
                    </td>
                    <td>${r}</td>
                    <td>${u}</td>
                    <td>
                        <div class="admin-post-actions">
                            <button class="admin-post-action-btn admin-post-action-btn--edit" type="button" data-action="edit-post" data-post-id="${n.id}">\uC218\uC815</button>
                            <button class="admin-post-action-btn admin-post-action-btn--delete" type="button" data-action="delete-post" data-post-id="${n.id}">\uC0AD\uC81C</button>
                            <a href="/ko/blog/${n.slug}/" target="_blank" rel="noreferrer" class="admin-post-action-btn admin-post-action-btn--preview">\uBBF8\uB9AC\uBCF4\uAE30</a>
                        </div>
                    </td>
                `,e.appendChild(i)})}catch(t){console.error("Error loading posts:",t),o.style.display="none",t.status===404?e.innerHTML='<tr><td colspan="5" class="admin-empty-state" style="color: #b91c1c;">PocketBase\uC5D0 "posts" \uCEEC\uB809\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</td></tr>':m("\uAE00 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4","error")}},openAddModal:function(e){this.currentPost=null,this.imageToUpload=null,this.existingImage=null,this._currentTrigger=e||document.getElementById("add-post-btn")||document.activeElement,document.getElementById("post-form").reset(),this.easyMDE&&this.easyMDE.value(""),document.getElementById("post-id").value="",document.getElementById("postModalLabel").innerText="\uAE00 \uC4F0\uAE30",document.getElementById("post-image-preview").style.display="none",document.getElementById("post-published").checked=!0,this.openModal()},openEditModal:async function(e,o){try{let t=await this.pb.collection("posts").getOne(e);this.currentPost=t,this.imageToUpload=null,this.existingImage=t.image,this._currentTrigger=o||document.activeElement,document.getElementById("post-id").value=t.id,document.getElementById("post-title").value=t.title,document.getElementById("post-slug").value=t.slug,this.easyMDE&&this.easyMDE.value(t.content||""),document.getElementById("post-published").checked=t.published;let n=t.tags;Array.isArray(n)&&(n=n.join(", "));let i=t.categories;if(Array.isArray(i)?i=i.join(", "):typeof i=="object"&&i!==null&&(i=""),document.getElementById("post-tags").value=n||"",document.getElementById("post-categories").value=i||"",t.image){let a=this.pb.files.getUrl(t,t.image),r=document.getElementById("post-image-preview");r.querySelector("img").src=a,r.style.display="block"}else document.getElementById("post-image-preview").style.display="none";document.getElementById("postModalLabel").innerText="\uAE00 \uC218\uC815",this.openModal()}catch(t){console.error("Error fetching post details:",t),m("\uAE00 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4","error")}},savePost:async function(){let e=document.getElementById("post-id").value,o=document.getElementById("post-title").value,t=document.getElementById("post-slug").value,n=this.easyMDE?this.easyMDE.value():document.getElementById("post-content").value,i=document.getElementById("post-published").checked,a=document.getElementById("post-tags").value,r=document.getElementById("post-categories").value,u=a?a.split(",").map(d=>d.trim()).filter(d=>d):[],c=r?r.split(",").map(d=>d.trim()).filter(d=>d):[];if(!o.trim()){m("\uC81C\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.","error");return}if(!t.trim()){m("\uC2AC\uB7EC\uADF8(URL)\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.","error");return}let s=new FormData;s.append("title",o),s.append("slug",t),s.append("content",n),s.append("published",i),s.append("tags",JSON.stringify(u)),s.append("categories",JSON.stringify(c)),this.imageToUpload?s.append("image",this.imageToUpload):e&&this.existingImage===null&&s.append("image","");try{e?await this.pb.collection("posts").update(e,s):await this.pb.collection("posts").create(s),this.closeModal(),this.loadPosts()}catch(d){console.error("Error saving post:",d);let f=`\uAE00 \uC800\uC7A5 \uC2E4\uD328:
`;if(d.response&&d.response.data){let y=[];for(let I in d.response.data)y.push(`- ${I}: ${d.response.data[I].message}`);y.length>0?f+=y.join(`
`):f+=d.message}else f+=d.message;m(f,"error",5200)}},deletePost:async function(e){if(await V({title:"\uAE00 \uC0AD\uC81C",message:"\uC815\uB9D0 \uC774 \uAE00\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",confirmLabel:"\uC0AD\uC81C",danger:!0}))try{await this.pb.collection("posts").delete(e),this.loadPosts(),m("\uAE00\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBE14\uB85C\uADF8\uC5D0 \uBC18\uC601\uD558\uB824\uBA74 \uD130\uBBF8\uB110\uC5D0\uC11C pnpm sync\uB97C \uC2E4\uD589\uD558\uC138\uC694.","success",4200)}catch(t){console.error("Error deleting post:",t),m("\uAE00 \uC0AD\uC81C \uC2E4\uD328","error")}},handleImageSelect:function(e){if(e.files&&e.files[0]){let o=e.files[0];this.imageToUpload=o;let t=new FileReader;t.onload=function(n){let i=document.getElementById("post-image-preview");i.querySelector("img").src=n.target.result,i.style.display="block"},t.readAsDataURL(o)}},clearImage:function(){let e=document.getElementById("post-image");e&&(e.value="");let o=document.getElementById("post-image-preview");if(o){let t=o.querySelector("img");t&&(t.src=""),o.style.display="none"}this.imageToUpload=null,this.existingImage=null},_slugGenerator:function(){let e=document.getElementById("post-title"),o=document.getElementById("post-slug"),n=e.value.toLowerCase().trim().replace(/\s+/g,"-").replace(/[^\w\-가-힣]/g,"").replace(/^-|-$/g,"");n||(n="post-"+Date.now()),o.value=n},_extractVideoInfo:function(e){if(!e)return null;let o=e.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);if(o&&o[1])return{type:"youtube",id:o[1]};let t=e.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);return t&&t[1]?{type:"vimeo",id:t[1]}:e.match(/\.(mp4|webm|ogg)$/i)?{type:"video",src:e}:null},drawVideoButton:async function(e){let o=e.codemirror,t=await H({title:"\uB3D9\uC601\uC0C1 \uC0BD\uC785",message:`\uB3D9\uC601\uC0C1 URL \uB610\uB294 Embed \uCF54\uB4DC\uB97C \uC785\uB825\uD558\uC138\uC694.
\uC9C0\uC6D0: YouTube, Vimeo, .mp4`,placeholder:"https://www.youtube.com/watch?v=...",confirmLabel:"\uC0BD\uC785",validate(a){return a?"":"\uB3D9\uC601\uC0C1 \uB9C1\uD06C\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."}});if(!t)return;let n=x._extractVideoInfo(t);if(!n){m(`\uC720\uD6A8\uD55C \uB3D9\uC601\uC0C1 \uB9C1\uD06C\uB098 \uCF54\uB4DC\uAC00 \uC544\uB2D9\uB2C8\uB2E4.
\uC9C0\uC6D0: YouTube, Vimeo, .mp4 \uD30C\uC77C \uB9C1\uD06C`,"error",4200);return}let i="";n.type==="youtube"?i=`{{< youtube ${n.id} >}}`:n.type==="vimeo"?i=`{{< vimeo ${n.id} >}}`:n.type==="video"&&(i=`{{< video src="${n.src}" >}}`),o.replaceSelection(i)}};document.addEventListener("DOMContentLoaded",function(){x.init()});})();
