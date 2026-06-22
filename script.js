import { db } from "./firebase.js";

import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ========================
// 전역 변수
// ========================

let currentCompany = "1";

let members = [];

let currentAssignments = [];


// ========================
// DOM
// ========================

const companySelect =
document.getElementById("companySelect");

const memberTableBody =
document.getElementById("memberTableBody");

const currentTarget =
document.getElementById("currentTarget");

const addMemberBtn =
document.getElementById("addMemberBtn");

const bulkAddBtn =
document.getElementById("bulkAddBtn");

const assignBtn =
document.getElementById("assignBtn");

const shuffleBtn =
document.getElementById("shuffleBtn");

const newName =
document.getElementById("newName");

const bulkInput =
document.getElementById("bulkInput");

const assignCount =
document.getElementById("assignCount");


// ========================
// 탭
// ========================

const tabButtons =
document.querySelectorAll(".tab-btn");

const tabContents =
document.querySelectorAll(".tab-content");

tabButtons.forEach(btn=>{

    btn.addEventListener(
        "click",
        ()=>{

            tabButtons.forEach(v=>{

                v.classList.remove("active");

            });

            tabContents.forEach(v=>{

                v.classList.remove("active");

            });

            btn.classList.add("active");

            const tab =
            btn.dataset.tab;

            if(tab==="members"){

                document
                .getElementById("membersTab")
                .classList.add("active");

            }

            if(tab==="history"){

                document
                .getElementById("historyTab")
                .classList.add("active");

            }

            if(tab==="stats"){

                document
                .getElementById("statsTab")
                .classList.add("active");

            }

        }
    );

});


// ========================
// 중대 변경
// ========================

companySelect.addEventListener(
    "change",
    ()=>{

        currentCompany =
        companySelect.value;

        loadMembers();

    }
);


// ========================
// 시작
// ========================

loadMembers();

// ========================
// 인원 불러오기
// ========================

async function loadMembers(){

    members = [];

    memberTableBody.innerHTML = "";

    const memberCollection =
    collection(
        db,
        "companies",
        currentCompany,
        "members"
    );

    const q =
    query(
        memberCollection,
        orderBy("order")
    );

    const snapshot =
    await getDocs(q);

    snapshot.forEach(docSnap=>{

        members.push({

            id:docSnap.id,

            ...docSnap.data()

        });

    });

    renderTable();

    updateCurrentTarget();

}


// ========================
// 현재 순번 표시
// ========================

function updateCurrentTarget(){

    if(members.length===0){

        currentTarget.textContent =
        "없음";

        return;

    }

    const currentMember =
    members.find(
        m=>m.isCurrent===true
    );

    if(currentMember){

        currentTarget.textContent =
        currentMember.name;

    }else{

        currentTarget.textContent =
        members[0].name;

    }

}


// ========================
// 테이블 렌더링
// ========================

function renderTable(){

    memberTableBody.innerHTML = "";

    members.forEach(member=>{

        renderMember(member);

    });

}


// ========================
// 상태 아이콘
// ========================

function getStatusIcon(status){

    switch(status){

        case "pending":
            return "⏳";

        case "confirmed":
            return "✅";

        case "absent":
            return "❌";

        default:
            return "-";

    }

}


// ========================
// 행 생성
// ========================

function renderMember(member){

    const tr =
    document.createElement("tr");

    tr.innerHTML = `

    <td>
        ${getStatusIcon(member.status)}
    </td>

    <td>
        ${member.name}
    </td>

    <td>

        <button
        onclick="addWarning('${member.id}')">
        +
        </button>

        ${"⚠️".repeat(
            member.warningCount || 0
        )}

        <button
        onclick="removeWarning('${member.id}')">
        -
        </button>

    </td>

    <td>

        <button
        onclick="addPass('${member.id}')">
        +
        </button>

        ${"🚫".repeat(
            member.passCount || 0
        )}

        <button
        onclick="removePass('${member.id}')">
        -
        </button>

    </td>

    <td>

        <select
        onchange="
        changeParticipation(
        '${member.id}',
        this.value
        )">

            <option
            value="true"
            ${
                member.participating
                ? "selected"
                : ""
            }>
            참여
            </option>

            <option
            value="false"
            ${
                !member.participating
                ? "selected"
                : ""
            }>
            불참
            </option>

        </select>

    </td>

    <td>

        <input
        type="text"
        value="${member.memo || ""}"

        onchange="
        saveMemo(
        '${member.id}',
        this.value
        )">

    </td>

    <td>

        <button
        onclick="editMember('${member.id}')">

        수정

        </button>

    </td>

    <td>

        <button
        onclick="deleteMember('${member.id}')">

        삭제

        </button>

    </td>

    `;

    memberTableBody.appendChild(tr);

}
// ========================
// 개별 추가
// ========================

addMemberBtn.addEventListener(
    "click",
    addMember
);

async function addMember(){

    const name =
    newName.value.trim();

    if(!name){

        alert("이름을 입력하세요.");

        return;

    }

    const memberCollection =
    collection(
        db,
        "companies",
        currentCompany,
        "members"
    );

    await addDoc(
        memberCollection,
        {

            name:name,

            order:members.length,

            warningCount:0,

            passCount:0,

            participating:true,

            memo:"",

            status:"idle",

            isCurrent:
            members.length===0

        }
    );

    newName.value="";

    await loadMembers();

}


// ========================
// 대량 등록
// ========================

bulkAddBtn.addEventListener(
    "click",
    bulkAddMembers
);

async function bulkAddMembers(){

    const names =
    bulkInput.value
    .split("\n")
    .map(v=>v.trim())
    .filter(v=>v);

    if(names.length===0){

        alert("이름을 입력하세요.");

        return;

    }

    const memberCollection =
    collection(
        db,
        "companies",
        currentCompany,
        "members"
    );

    for(
        let i=0;
        i<names.length;
        i++
    ){

        await addDoc(
            memberCollection,
            {

                name:names[i],

                order:
                members.length+i,

                warningCount:0,

                passCount:0,

                participating:true,

                memo:"",

                status:"idle",

                isCurrent:false

            }
        );

    }

    bulkInput.value="";

    await loadMembers();

}


// ========================
// 이름 수정
// ========================

window.editMember =
async function(id){

    const member =
    members.find(
        m=>m.id===id
    );

    if(!member){

        return;

    }

    const newMemberName =
    prompt(
        "새 이름 입력",
        member.name
    );

    if(
        !newMemberName ||
        !newMemberName.trim()
    ){

        return;

    }

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberDoc,
        {

            name:
            newMemberName.trim()

        }
    );

    await loadMembers();

};


// ========================
// 삭제
// ========================

window.deleteMember =
async function(id){

    const result =
    confirm(
        "정말 삭제하시겠습니까?"
    );

    if(!result){

        return;

    }

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await deleteDoc(
        memberDoc
    );

    await reorderMembers();

    await loadMembers();

};


// ========================
// 순번 재정렬
// ========================

async function reorderMembers(){

    for(
        let i=0;
        i<members.length;
        i++
    ){

        const member =
        members[i];

        const memberDoc =
        doc(
            db,
            "companies",
            currentCompany,
            "members",
            member.id
        );

        await updateDoc(
            memberDoc,
            {
                order:i
            }
        );

    }

}
// ========================
// 경고권 +
// ========================

window.addWarning =
async function(id){

    const member =
    members.find(
        m=>m.id===id
    );

    if(!member){
        return;
    }

    let warning =
    member.warningCount || 0;

    let pass =
    member.passCount || 0;

    if(pass > 0){

        pass--;

    }else{

        warning++;

    }

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberDoc,
        {
            warningCount:warning,
            passCount:pass
        }
    );

    await loadMembers();

};


// ========================
// 경고권 -
// ========================

window.removeWarning =
async function(id){

    const member =
    members.find(
        m=>m.id===id
    );

    if(!member){
        return;
    }

    let warning =
    member.warningCount || 0;

    warning =
    Math.max(
        0,
        warning - 1
    );

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberDoc,
        {
            warningCount:warning
        }
    );

    await loadMembers();

};


// ========================
// 패스권 +
// ========================

window.addPass =
async function(id){

    const member =
    members.find(
        m=>m.id===id
    );

    if(!member){
        return;
    }

    let warning =
    member.warningCount || 0;

    let pass =
    member.passCount || 0;

    if(warning > 0){

        warning--;

    }else{

        pass++;

    }

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberDoc,
        {
            warningCount:warning,
            passCount:pass
        }
    );

    await loadMembers();

};


// ========================
// 패스권 -
// ========================

window.removePass =
async function(id){

    const member =
    members.find(
        m=>m.id===id
    );

    if(!member){
        return;
    }

    let pass =
    member.passCount || 0;

    pass =
    Math.max(
        0,
        pass - 1
    );

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberDoc,
        {
            passCount:pass
        }
    );

    await loadMembers();

};


// ========================
// 참여 여부 변경
// ========================

window.changeParticipation =
async function(
    id,
    value
){

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberDoc,
        {
            participating:
            value === "true"
        }
    );

};


// ========================
// 메모 저장
// ========================

window.saveMemo =
async function(
    id,
    memo
){

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberDoc,
        {
            memo:memo
        }
    );

};
// ========================
// 배정 시작 버튼
// ========================

assignBtn.addEventListener(
    "click",
    startAssignment
);


// ========================
// 배정 시작
// ========================

async function startAssignment(){

    const requiredCount =
    parseInt(
        assignCount.value
    );

    if(
        isNaN(requiredCount) ||
        requiredCount <= 0
    ){

        alert(
            "배정 인원을 입력하세요."
        );

        return;
    }

    currentAssignments = [];

    let needed =
    requiredCount;


    // ====================
    // 1. 경고권 우선
    // ====================

    let warningMembers =
    members.filter(
        m =>
        (m.warningCount || 0) > 0
    );

    warningMembers.sort(
        (a,b)=>
        b.warningCount -
        a.warningCount
    );

    for(
        const member
        of warningMembers
    ){

        if(
            needed <= 0
        ){
            break;
        }

        currentAssignments.push(
            member
        );

        const memberDoc =
        doc(
            db,
            "companies",
            currentCompany,
            "members",
            member.id
        );

        await updateDoc(
            memberDoc,
            {
                warningCount:
                Math.max(
                    0,
                    (member.warningCount || 0) - 1
                ),
                status:"pending"
            }
        );

        needed--;

    }


    // ====================
    // 2. 현재 순번 찾기
    // ====================

    let currentIndex =
    members.findIndex(
        m =>
        m.isCurrent === true
    );

    if(
        currentIndex === -1
    ){

        currentIndex = 0;

    }


    // ====================
    // 3. 순환 배정
    // ====================

    let loopCount = 0;

    while(
        needed > 0 &&
        loopCount <
        members.length * 3
    ){

        const member =
        members[currentIndex];

        const alreadyAssigned =
        currentAssignments.some(
            m =>
            m.id === member.id
        );

        if(
            !alreadyAssigned
        ){

            const passCount =
            member.passCount || 0;

            if(
                passCount > 0
            ){

                const memberDoc =
                doc(
                    db,
                    "companies",
                    currentCompany,
                    "members",
                    member.id
                );

                await updateDoc(
                    memberDoc,
                    {
                        passCount:
                        passCount - 1
                    }
                );

            }
            else{

                currentAssignments.push(
                    member
                );

                const memberDoc =
                doc(
                    db,
                    "companies",
                    currentCompany,
                    "members",
                    member.id
                );

                await updateDoc(
                    memberDoc,
                    {
                        status:"pending"
                    }
                );

                needed--;

            }

        }

        currentIndex++;

        if(
            currentIndex >=
            members.length
        ){

            currentIndex = 0;

        }

        loopCount++;

    }


    // ====================
    // 4. 현재 순번 이동
    // ====================

    await updateCurrentOrder(
        currentIndex
    );

    await loadMembers();

    alert(
        `${currentAssignments.length}명 배정 완료`
    );

}


// ========================
// 현재 순번 갱신
// ========================

async function updateCurrentOrder(
    nextIndex
){

    for(
        const member
        of members
    ){

        const memberDoc =
        doc(
            db,
            "companies",
            currentCompany,
            "members",
            member.id
        );

        await updateDoc(
            memberDoc,
            {
                isCurrent:false
            }
        );

    }

    if(
        members.length === 0
    ){
        return;
    }

    if(
        nextIndex >=
        members.length
    ){

        nextIndex = 0;

    }

    const nextMember =
    members[nextIndex];

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        nextMember.id
    );

    await updateDoc(
        memberDoc,
        {
            isCurrent:true
        }
    );

}
// ========================
// 배정 상태 변경
// ========================

window.changeAssignmentStatus =
async function(
    id,
    status
){

    const memberDoc =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberDoc,
        {
            status:status
        }
    );

    await loadMembers();

    if(
        status === "absent"
    ){

        await autoReplaceMember();

    }

    await checkAssignmentCompletion();

};


// ========================
// 자동 충원
// ========================

async function autoReplaceMember(){

    await loadMembers();

    let replacement = null;


    // ====================
    // 경고권 우선
    // ====================

    const warningMembers =
    members.filter(
        m =>
        (m.warningCount || 0) > 0 &&
        m.status !== "confirmed" &&
        m.status !== "pending"
    );

    if(
        warningMembers.length > 0
    ){

        warningMembers.sort(
            (a,b)=>
            b.warningCount -
            a.warningCount
        );

        replacement =
        warningMembers[0];

    }


    // ====================
    // 일반 순번
    // ====================

    if(!replacement){

        let currentIndex =
        members.findIndex(
            m =>
            m.isCurrent === true
        );

        if(
            currentIndex === -1
        ){

            currentIndex = 0;

        }

        let loopCount = 0;

        while(
            loopCount <
            members.length
        ){

            const member =
            members[currentIndex];

            const unavailable =
            (
                member.status ===
                "confirmed"
            )
            ||
            (
                member.status ===
                "pending"
            );

            if(
                !unavailable
            ){

                if(
                    (member.passCount || 0)
                    > 0
                ){

                    const memberDoc =
                    doc(
                        db,
                        "companies",
                        currentCompany,
                        "members",
                        member.id
                    );

                    await updateDoc(
                        memberDoc,
                        {
                            passCount:
                            member.passCount - 1
                        }
                    );

                }
                else{

                    replacement =
                    member;

                    break;

                }

            }

            currentIndex++;

            if(
                currentIndex >=
                members.length
            ){

                currentIndex = 0;

            }

            loopCount++;

        }

    }


    // ====================
    // 충원
    // ====================

    if(replacement){

        const memberDoc =
        doc(
            db,
            "companies",
            currentCompany,
            "members",
            replacement.id
        );

        await updateDoc(
            memberDoc,
            {
                status:"pending"
            }
        );

        alert(
            `${replacement.name} 자동 충원`
        );

        await loadMembers();

    }

}


// ========================
// 배정 종료 확인
// ========================

async function checkAssignmentCompletion(){

    await loadMembers();

    const pendingCount =
    members.filter(
        m =>
        m.status === "pending"
    ).length;

    if(
        pendingCount > 0
    ){

        return;

    }

    const confirmedCount =
    members.filter(
        m =>
        m.status === "confirmed"
    ).length;

    if(
        confirmedCount === 0
    ){

        return;

    }

    await saveAssignmentHistory();

}
// ========================
// 배정 이력 저장
// ========================

async function saveAssignmentHistory(){

    const confirmedMembers =
    members.filter(
        m =>
        m.status === "confirmed"
    );

    if(
        confirmedMembers.length === 0
    ){
        return;
    }

    const historyCollection =
    collection(
        db,
        "companies",
        currentCompany,
        "assignments"
    );

    await addDoc(
        historyCollection,
        {

            createdAt:
            new Date().toISOString(),

            company:
            currentCompany,

            members:
            confirmedMembers.map(
                m => ({
                    id:m.id,
                    name:m.name
                })
            )

        }
    );

    alert(
        "배정이 종료되었습니다."
    );

}


// ========================
// 이력 조회
// ========================

const historyList =
document.getElementById(
    "historyList"
);

const historySearchBtn =
document.getElementById(
    "historySearchBtn"
);

historySearchBtn.addEventListener(
    "click",
    loadHistory
);


// ========================
// 이력 불러오기
// ========================

async function loadHistory(){

    historyList.innerHTML = "";

    const historyCollection =
    collection(
        db,
        "companies",
        currentCompany,
        "assignments"
    );

    const snapshot =
    await getDocs(
        historyCollection
    );

    let histories = [];

    snapshot.forEach(docSnap=>{

        histories.push({

            id:docSnap.id,

            ...docSnap.data()

        });

    });

    histories.sort(
        (a,b)=>
        b.createdAt.localeCompare(
            a.createdAt
        )
    );

    const startDate =
    document
    .getElementById(
        "historyStart"
    )
    .value;

    const endDate =
    document
    .getElementById(
        "historyEnd"
    )
    .value;

    histories.forEach(history=>{

        const historyDate =
        history.createdAt
        .substring(0,10);

        if(
            startDate &&
            historyDate < startDate
        ){
            return;
        }

        if(
            endDate &&
            historyDate > endDate
        ){
            return;
        }

        const div =
        document.createElement(
            "div"
        );

        div.className =
        "history-item";

        div.innerHTML = `

        <div>

        <strong>
        ${history.createdAt}
        </strong>

        </div>

        <div>

        ${
            history.members
            .map(
                m => m.name
            )
            .join(", ")
        }

        </div>

        `;

        historyList.appendChild(
            div
        );

    });

}

