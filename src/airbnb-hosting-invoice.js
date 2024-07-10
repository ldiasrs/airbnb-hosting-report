import { readFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const debug = (msg) => {
  console.log(msg);
};

const readInputFile = (filePath) => {
  const csvFile = readFileSync(filePath, "utf8");
  const results = Papa.parse(csvFile, { delimiter: "," });
  const rawData = results.data.slice(1).map((row) => ({
    date: row[0],
    arrivingDate: row[1],
    type: row[2],
    confirmationCode: row[3],
    nights: row[4],
    guest: row[5],
    listing: row[6],
    details: row[7],
    referenceCode: row[8],
    amount: row[9],
    paidOut: row[10],
    serviceFee: row[11],
    cleaningFee: row[12],
    grossEarnings: row[13],
  }));

  const bookingMap = new Map();
  rawData.forEach((row) => {
    if (!row.date) return;
    const key = row.date;
    const reservation = bookingMap.get(key) ?? { date: key };
    if (row.type === "Payout") {
      reservation.paidOut = row.paidOut;
      reservation.details = row.details;
      reservation.arrivingDate = row.arrivingDate;
    }
    if (row.type === "Co-host payout") {
      reservation.listing = row.listing;
      reservation.confirmationCode = row.confirmationCode;
      reservation.guest = row.guest;
      reservation.referenceCode = row.referenceCode;
      reservation.coHostPayout = row.amount;
      reservation.nights = row.nights;
    }
    if (row.type === "Reservation") {
      reservation.reservationAmount = row.amount;
      reservation.serviceFee = row.serviceFee;
      reservation.cleaningFee = row.cleaningFee;
      reservation.grossEarnings = row.grossEarnings;
    }
    bookingMap.set(key, reservation);
  });
  return Array.from(bookingMap.values()).filter(
    (booking) => !!booking.confirmationCode
  );
};

const normalizeFloat = (value) => {
  return value ? parseFloat(value?.replace("$", "")) : 0;
};

const percentage = (total, value) => {
  return Number(((value / total) * 100).toFixed(2));
};

const calculatePrices = (booking) => {
  const grossEarning = normalizeFloat(booking.grossEarnings);
  //airbnbService = grossEarning * 3.3%
  const airbnbService = normalizeFloat(booking.serviceFee);
  const cleaningFee = normalizeFloat(booking.cleaningFee);
  //reservationAmount = grossEarning * 96.7%
  const grossEarningWithoutCleaning = grossEarning - cleaningFee;
  const reservationAmount = normalizeFloat(booking.reservationAmount);
  const reservationAmountWithoutCleaning = reservationAmount - cleaningFee;
  //coHostPayout = reservationAmount * 80%
  const coHostPayout = -normalizeFloat(booking.coHostPayout);
  //coHostPayout = reservationAmount * 20%
  const hostingService = Number(
    (reservationAmount - coHostPayout - cleaningFee).toFixed(2)
  );
  const fairHostingService = Number(
    (grossEarningWithoutCleaning * 0.2).toFixed(2)
  );
  const nights = normalizeFloat(booking.nights);
  const nightlyGrossEarning = Number((reservationAmount / nights).toFixed(2));
  const total = reservationAmountWithoutCleaning;

  return {
    nights,
    grossEarning,
    cleaningFee,
    grossEarningWithoutCleaning,
    airbnbService,
    reservationAmount,
    reservationAmountWithoutCleaning,
    ownerPayout: coHostPayout,
    ownerPayoutPercentage: percentage(total, coHostPayout),
    airnbHostingPayout: booking.paidOut,
    hostingService,
    hostingServicePercentage: percentage(total, hostingService),
    fairHostingService,
    fairHostingServicePercentage: percentage(total, fairHostingService),
    cleaningFeePercentage: percentage(total, cleaningFee),
    nightlyGrossEarning,
  };
};
const generateReportData = (bookingData) => {
  const reservations = bookingData.map((booking) => {
    return {
      reservationCode: booking.confirmationCode ?? "",
      guest: booking.guest,
      paymentDate: booking.date,
      arrivingDate: booking.arrivingDate,
      ...calculatePrices(booking),
    };
  });
  const totalHostingServices = reservations.reduce(
    (acc, curr) => acc + curr.hostingService,
    0
  );
  const farTotalHostingServices = reservations.reduce(
    (acc, curr) => acc + curr.fairHostingService,
    0
  );
  return {
    reservations,
    totalHostingServices,
    farTotalHostingServices,
  };
};

export const generateHostingInvoiceSpreadsheet = async (inputFilePath) => {
  try {
    console.log("Generating Hosting Invoice Spreadsheet");
    if (!inputFilePath) {
      console.error("\nERROR: file path not found");
      return;
    }

    debug("Reading inputile");
    const bookings = readInputFile(inputFilePath);
    // const bookings = readInputFile(
    //   "./data/treehaus_apr_airbnb_04_2024-04_2024.csv"
    // );

    debug("Generating report data");
    const report = generateReportData(bookings);

    const fullReport = { bookings, report };
    console.log(JSON.stringify(fullReport));

    return fullReport;
  } catch (error) {
    console.error("Error writing data to spreadsheet:", error);
  }
};

await generateHostingInvoiceSpreadsheet();
