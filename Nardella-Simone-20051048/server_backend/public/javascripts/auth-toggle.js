$(document).ready(function () {
  $('#register-link').click(function (e) {
    e.preventDefault();
    $('#login-form').addClass('hidden');
    $('#register-form').removeClass('hidden');
  });

  $('#login-link').click(function (e) {
    e.preventDefault();
    $('#register-form').addClass('hidden');
    $('#login-form').removeClass('hidden');
  });
});
