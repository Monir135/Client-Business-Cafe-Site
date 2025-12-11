
const form = document.getElementById('reservationForm');
const message = document.getElementById('reservationMessage');
const refInput = document.getElementById("ref");


function playConfirmationVoice() {
  // Check browser supports speech synthesis
  if ('speechSynthesis' in window) {
    const msg = new SpeechSynthesisUtterance("Your booking is confirmed. Thank you for choosing Café Aroma!");
    msg.lang = "en-US";
    msg.pitch = 1.2;   // slightly higher pitch = cheerful
    msg.rate = 1;      // normal speed
    msg.volume = 1;    // full volume
    window.speechSynthesis.speak(msg);
  } else {
    console.log("Speech synthesis not supported in this browser.");
  }
}


form.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Generate booking reference
  const ref = "CA-" + Date.now().toString().slice(-6);

  // Put into hidden field (so formData includes it automatically)
  refInput.value = ref;

  const formData = new FormData(form);

  const name = formData.get("name");
  const date = formData.get("date");
  const time = formData.get("time");
  const guests = formData.get("guests");

  message.innerHTML = "Confirming your reservation...";
  message.className = "info-message";

  // Send to Web3Forms
  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (result.success) {

    form.classList.add("hide-form");

    setTimeout(() => {
      playConfirmationVoice();
      form.style.display = "none";

      message.innerHTML = `
        <div class="confirmation-box">
          <strong class="confirmation-title">🎉 Reservation Confirmed</strong>
          <p>Your reservation is successfully recorded.</p><br>

          <p><strong>Booking Reference:</strong> 
          <span class="booking-ref">${ref}</span></p>

          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Guests:</strong> ${guests}</p><br>

          <p>Please present this reference number upon arrival.</p>

          <button id="downloadReceipt" class="download-btn">Download Receipt</button><br><br>

          <button id="backHome" class="btn-primary">⬅ Go back</button>
        </div>
      `;

      // Download receipt
      document.getElementById("downloadReceipt").addEventListener("click", () => {
        downloadReceipt(ref, name, date, time, guests);
      });

      // Go back button
      document.getElementById("backHome").addEventListener("click", () => {
        form.style.display = "block";   // show form again
        form.classList.remove("hide-form");
        form.reset();                   // clear old form
        message.innerHTML = "";         // remove confirmation box
        window.location.hash = "#reservation"; // scroll to form section
      });

      message.className = "";
    }, 500);

  } else {
    message.innerHTML = `
      <div class="error-box">
        ⚠ Unable to process your reservation.<br>
        Please try again.
      </div>
    `;
  }
});

function downloadReceipt(ref, name, date, time, guests) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  // Generate QR encoded with ONLY booking reference
  const qrContainer = document.createElement("div");
  new QRCode(qrContainer, {
    text: ref,
    width: 100,
    height: 100,
  });

  // Extract QR image
  const qrImage = qrContainer.querySelector("img")?.src ||
    qrContainer.querySelector("canvas").toDataURL("image/png");

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Café Aroma Reservation Receipt", 20, 20);

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(12);

  pdf.text(`Booking Reference: ${ref}`, 20, 40);
  pdf.text(`Name: ${name}`, 20, 50);
  pdf.text(`Date: ${date}`, 20, 60);
  pdf.text(`Time: ${time}`, 20, 70);
  pdf.text(`Guests: ${guests}`, 20, 80);

  pdf.text("Scan QR for quick verification:", 20, 100);
  pdf.addImage(qrImage, "PNG", 20, 110, 50, 50);

  pdf.text("Please show this receipt at the café entrance.", 20, 175);
  pdf.text("Thank you for choosing Café Aroma!", 20, 190);

  pdf.save(`Reservation-${ref}.pdf`);
}



