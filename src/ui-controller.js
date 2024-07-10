const uploadButton = document.getElementById("uploadButton");
const csvFile = document.getElementById("csvFile");
const tableContainer = document.getElementById("tableContainer");

uploadButton.addEventListener("click", async () => {
  const filename = csvFile.files[0]; // Get the uploaded file
  console.log("Uploading file:", filename.name);
  const formData = new FormData();
  formData.append("report", document.getElementById("csvFile").files[0]);

  try {
    const response = await fetch("/report", {
      method: "POST",
      body: formData,
    });
    const jsonData = await response.json();
    createTable(jsonData);
    createTotals(jsonData);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
});

function createTotals(data) {
  // Create element to display total hosting services
  const totalServicesElement = document.createElement("p");
  totalServicesElement.classList.add("total-services"); // Add a class for styling (optional)
  const farServicesElement = document.createElement("p");
  farServicesElement.classList.add("total-services"); // Add a class for styling (optional)

  // Check for existence of totalHostingServices before displaying
  if (data.report.totalHostingServices) {
    totalServicesElement.textContent = `Total Hosting Services: ${data.report.totalHostingServices}`;
  } else {
    totalServicesElement.textContent = "Total Hosting Services: Not Available";
  }

  // Check for existence of farTotalHostingServices before displaying (optional)
  if (data.report.farTotalHostingServices) {
    farServicesElement.classList.add("far-services"); // Add a class for styling (optional)
    farServicesElement.textContent = `Fair Total Hosting Services: ${data.report.farTotalHostingServices}`;
  }

  document.getElementById("tableContainer").appendChild(totalServicesElement);
  document.getElementById("tableContainer").appendChild(farServicesElement);
}

function createTable(data) {
  // Get the bookings and reservations data
  const bookings = data.bookings;
  const reservations = data.report.reservations;

  // Create the table element
  const table = document.createElement("table");
  //table.classList.add("bookings-table"); // Add a class for styling (optional)
  table.classList.add("thead-light"); // Add a class for styling (optional)

  // Create the table header row
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
      <th>Date</th>
      <th>Guest</th>
      <th>Confirmation Code</th>
      <th>Nights</th>
      <th>Reservation Amount</th>
      <th>Cleaning Fee</th>
      <th>Gross Earnings</th>
      <th>Airbnb Service</th>
      <th>Owner Payout</th>
      <th>Airbnb Hosting Payout</th>
      <th>Fair Hosting Service</th>
    `;
  table.appendChild(headerRow);

  // Loop through reservations and create table rows
  for (const reservation of reservations) {
    const row = document.createElement("tr");

    // Find corresponding booking data based on reservation code
    const booking = bookings.find(
      (booking) => booking.confirmationCode === reservation.reservationCode
    );

    row.innerHTML = `
        <td>${booking.date}</td>
        <td>${reservation.guest}</td>
        <td>${reservation.reservationCode}</td>
        <td>${reservation.nights}</td>
        <td>$ ${reservation.reservationAmount}</td>
        <td>$ ${reservation.cleaningFee}</td>
        <td>$ ${reservation.grossEarning}</td>
        <td>$ ${reservation.airbnbService}</td>
        <td>$ ${reservation.ownerPayout}</td>
        <td>$ ${reservation.airnbHostingPayout}</td>
        <td>$ ${reservation.fairHostingService}</td>
      `;

    table.appendChild(row);
  }

  document.getElementById("tableContainer").appendChild(table);
}

// Function to create a table header cell (TH)
function createTHCell(text) {
  const cell = document.createElement("th");
  cell.innerText = text;
  return cell;
}

// Function to create a table data cell (TD)
function createTDCell(text) {
  const cell = document.createElement("td");
  cell.innerText = text;
  return cell;
}
