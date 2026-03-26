$(document).ready(function () {
  var $checkIn = $('#check_in');
  var $checkOut = $('#check_out');

  $checkIn.on('change', function () {
    if ($checkIn.val()) {
      $checkOut.attr('min', $checkIn.val());
      if ($checkOut.val() && $checkOut.val() < $checkIn.val()) {
        $checkOut.val($checkIn.val());
      }
    }
  });
});
