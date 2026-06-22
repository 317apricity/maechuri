import { db } from "./firebase.js";

import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ------------------
// 현재 선택 중대
// ------------------

let currentCompany = "1";


// ------------------
// DOM
// ------------------

const companySelect =
document.getElementById("companySelect");

const memberTableBody =
document.getElementById("memberTableBody");

const addMemberBtn =
document.getElementById("addMemberBtn");

const newMemberName =
document.getElementById("newMemberName");

const bulkRegisterBtn =
document.getElementById("bulkRegisterBtn");

const bulkInput =
document.getElementById("bulkInput");


// ------------------
// 중대 변경
// ------------------

companySelect.addEventListener(
    "change",
    () => {

        currentCompany =
        companySelect.value;

        loadMembers();
    }
);


// ------------------
// 인원 불러오기
// ------------------

async function loadMembers(){

    memberTableBody.innerHTML = "";

    const membersRef =
    collection(
        db,
        "companies",
        currentCompany,
        "members"
    );

    const snapshot =
    await getDocs(membersRef);

    const members = [];

    snapshot.forEach(docSnap => {

        members.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    members.sort(
        (a,b) =>
        (a.order ?? 9999)
        -
        (b.order ?? 9999)
    );

    members.forEach(member => {

        renderMember(member);

    });

}


// ------------------
// 행 생성
// ------------------

function renderMember(member){

    const tr =
    document.createElement("tr");

    tr.innerHTML = `

    <td>
        -
    </td>

    <td>
        ${member.name}
    </td>

    <td>
        ${"⚠️".repeat(member.warningCount || 0)}
    </td>

    <td>
        ${"🚫".repeat(member.passCount || 0)}
    </td>

    <td>
        ${
            member.participating
            ? "참여"
            : "미참여"
        }
    </td>

    <td>
        ${member.memo || ""}
    </td>

    <td>

        <button
        onclick="editMember('${member.id}')">

        수정

        </button>

    </td>

    <td>

        <button
        onclick="deleteMemberConfirm('${member.id}')">

        삭제

        </button>

    </td>

    `;

    memberTableBody.appendChild(tr);

}


// ------------------
// 개별 추가
// ------------------

addMemberBtn.addEventListener(
    "click",
    async () => {

        const name =
        newMemberName.value.trim();

        if(!name){

            alert("이름 입력");

            return;
        }

        const membersRef =
        collection(
            db,
            "companies",
            currentCompany,
            "members"
        );

        const count =
        memberTableBody.children.length;

        await addDoc(
            membersRef,
            {

                name,

                order: count,

                warningCount: 0,

                passCount: 0,

                participating: true,

                memo: "",

                status: "idle"

            }
        );

        newMemberName.value = "";

        loadMembers();
    }
);


// ------------------
// 일괄 등록
// ------------------

bulkRegisterBtn.addEventListener(
    "click",
    async () => {

        const names =
        bulkInput.value
        .split("\n")
        .map(v => v.trim())
        .filter(v => v);

        if(names.length === 0){

            alert("이름 입력");

            return;
        }

        const membersRef =
        collection(
            db,
            "companies",
            currentCompany,
            "members"
        );

        const currentCount =
        memberTableBody.children.length;

        for(let i=0;i<names.length;i++){

            await addDoc(
                membersRef,
                {

                    name: names[i],

                    order:
                    currentCount + i,

                    warningCount: 0,

                    passCount: 0,

                    participating: true,

                    memo: "",

                    status: "idle"

                }
            );

        }

        bulkInput.value = "";

        loadMembers();
    }
);


// ------------------
// 수정
// ------------------

window.editMember =
async function(id){

    const newName =
    prompt(
        "새 이름 입력"
    );

    if(!newName){

        return;
    }

    const memberRef =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await updateDoc(
        memberRef,
        {
            name: newName
        }
    );

    loadMembers();
};


// ------------------
// 삭제
// ------------------

window.deleteMemberConfirm =
async function(id){

    const result =
    confirm(
        "삭제하시겠습니까?"
    );

    if(!result){

        return;
    }

    const memberRef =
    doc(
        db,
        "companies",
        currentCompany,
        "members",
        id
    );

    await deleteDoc(memberRef);

    loadMembers();
};


// ------------------
// 최초 실행
// ------------------

loadMembers();
