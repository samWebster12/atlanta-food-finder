document.addEventListener('DOMContentLoaded', () => {
    const logbut = document.getElementById('loginButton')
    const signbut = document.getElementById('signupButton')
    const logoutbut = document.getElementById('logoutButton')
    const authForm = document.getElementById('authForm')
    const authFormElem = document.getElementById('authFormElement')
    const authTitle = document.getElementById('authTitle')
    const authAction = document.getElementById('authAction')
    const emailText = document.getElementById('email')

    if(logbut){
        logbut.addEventListener('click', () => showAuthForm('login'));
    }
    if(logoutbut){
        logoutbut.addEventListener('click', () => handleLogout);
    }
    if(signbut){
        logbut.addEventListener('click', () => showAuthForm('signup'));
    }
    if(authFormElem){
        authFormElem.addEventListener('submit', () => handleAuth);
    }
    function showAuthForm(action){
        authform.style.display = 'block';
        authTitle.textContent = action === 'login' ? 'Login' : 'Sign Up';
        authAction.value = action;
        emailText.style.display = action === 'signup' ? 'block' : 'none';
    }
    async function handleAuth(e){
        e.preventDefault();
        const act = authAction.value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try{
            const res = await fetch(`/${act}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken' : getCookie('csrftoken')
                },
                body: JSON.stringify({username, password, email})
            });
            const data = await res.json();
            if(data.success){
                window.location.reload();
            } else {
                //error
            }
        } catch (error){
            //error occurred
        }

    }
    async function handleLogout(){
        try{
            const res = await fetch(`/logout/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken' : getCookie('csrftoken')
                },
            });
            const data = await res.json();
            if(data.success){
                window.location.reload();
            } else {
                //error
            }
        } catch (error){
            //error occurred
        }
    }
    //do get cookie fn.
});