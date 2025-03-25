// 生成密码
function generatePassword() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 验证密码
function verifyPassword() {
    const input = document.getElementById('password-input');
    const correctPassword = generatePassword();
    
    if (input.value === correctPassword) {
        // 密码正确，显示主界面
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('main-container').classList.remove('hidden');
        // 清空密码输入
        input.value = '';
    } else {
        alert('密码错误，请重试！');
        input.value = '';
    }
}

// 添加回车键监听
document.getElementById('password-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        verifyPassword();
    }
});

// 页面加载时显示验证界面
document.addEventListener('DOMContentLoaded', function() {
    // 确保主界面隐藏
    document.getElementById('main-container').classList.add('hidden');
    // 确保验证界面显示
    document.getElementById('auth-container').classList.remove('hidden');
}); 