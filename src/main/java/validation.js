"use strict"

let form = document.querySelector(".send_form"),
    x = document.getElementById('x_select'),
    y = document.getElementById('y_select'),
    r = document.querySelectorAll('input[name="r_radius"]');

let currentPage = 0;
const itemsPerPage = 10;


form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (validate()) {
        let rElements = [];
        for (let index = 0; index < r.length; index++) {
            if (r[index].checked) {
                rElements.push(r[index].value);
            }
        }
        let yVal = y.value.replace(',', '.');
        send(x, yVal, rElements);
    }
});


document.querySelectorAll("input[name='r_radius']").forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        document.querySelectorAll("input[name='r_radius']").forEach(cb => {
            if (cb !== this) cb.checked = false;
        });
    });
});

function send(x, yVal, rElements) {
    const data = JSON.stringify({x: x.value, y: yVal, r: rElements[0]});
    console.log(data);
    fetch('/fcgi-bin/Web_Lab1.jar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: data
    })
        .then(response => {
            response.json().then(result => {
                console.log('response accepted');
                saveResponseToLocalStorage(result);
                showResponses();
            }).catch(error => console.error('Error:', error));
        })
}

function getResponsesFromLocalStorage() {
    let data = localStorage.getItem("data")
    if (data == null) {
        data = '[]'
    }
    return JSON.parse(data);
}

function saveResponseToLocalStorage(response) {
    if (response.x !== undefined && response.y !== undefined && response.r !== undefined) {
    let responses = getResponsesFromLocalStorage()
    responses.push(response);
    localStorage.setItem("data", JSON.stringify(responses));}
}

function showResponses() {
    const resultBody = document.getElementById('result_table');
    resultBody.innerHTML = '';
    const responses = getResponsesFromLocalStorage();
    const validResponses = responses.filter(response => response.currentTime);

    validResponses.sort((a, b) => {
        const dateA = new Date(a.currentTime.split('-').reverse().join('-'));
        const dateB = new Date(b.currentTime.split('-').reverse().join('-'));
        return dateB - dateA;
    });
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResponses = validResponses.slice(startIndex, endIndex);

    paginatedResponses.forEach(response => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${response.x}</td>
            <td>${response.y}</td>
            <td>${response.r}</td>
            <td>${response.currentTime !== undefined ? response.currentTime : 'undefined'}</td>
            <td>${response.executionTime !== undefined ? response.executionTime : 'undefined'}</td>
            <td>${response.result !== undefined ? (response.result ? 'V is for victory' : 'D is for defeat') : 'undefined'}</td>
        `;
        resultBody.appendChild(newRow);
    });

    updatePaginationControls(responses.length);
}

function updatePaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-controls');

    paginationContainer.innerHTML = '';

    if (currentPage > 0) {
        let prevButton = document.createElement('button');
        prevButton.innerText = "Предыдущая";
        prevButton.onclick = () => {
            currentPage--;
            showResponses();
        };
        paginationContainer.appendChild(prevButton);
    }

    if (currentPage < totalPages - 1) {
        let nextButton = document.createElement('button');
        nextButton.innerText = "Следующая";
        nextButton.onclick = () => {
            currentPage++;
            showResponses();
        };
        paginationContainer.appendChild(nextButton);
    }
}

function showError(element, message) {
    const errorElement = document.createElement('div');
    errorElement.classList.add('error-message');
    errorElement.textContent = message;
    errorElement.style.margin = '15px';
    if(element == document.getElementById("checkboxes")){
        errorElement.style.margin = '0px';
    }
    errorElement.style.color = '#f4b3b3';
    errorElement.style.fontSize = '18px';
    errorElement.style.textAlign = 'center';
    element.parentNode.insertBefore(errorElement, element.nextSibling);
    element.addEventListener('input', function() {
        if (errorElement)
        errorElement.remove();
    }, { once: true });
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    console.log("я родился");
}


function validate(){

    if (document.querySelectorAll('.error-message').length > 0) {
        clearErrors();
    }
    let isValid = true;

    if (!checkX()) {
        isValid = false;
    }
    if (!checkY()) {
        isValid = false;
    }

    if (!checkR()) {
        isValid = false;
    }

    return isValid;
}
function checkX() {
    if (x.value === "") {
                showError(x, "Необходимо указать значение координаты X");
                return false;
            }
    return true;
}

function checkY() {
    let yVal = y.value.replace(',', '.');
    console.log(yVal);
    if (yVal === "") {
        showError(y, "Необходимо выбрать значение координаты Y");
        return false;
    }
    if (!/^-?\d+(\.\d+)?$/.test(yVal) || yVal < -3 || yVal > 3) {
            showError(y, "Необходимо ввести валидное значение Х от -3 до 3");
            return false;
    }
    return true;

}

function checkR(){
    let rElements = [];
    for (let index = 0; index < r.length; index++) {
        if (r[index].checked) {
            rElements.push(r[index].value);
        }
    }
    if (rElements.length === 0) {
        showError(document.getElementById("checkboxes"), "Необходимо указать значение радиуса R");
        return false;
        }

    return true;

}

window.onload = () => {
    showResponses();
}
