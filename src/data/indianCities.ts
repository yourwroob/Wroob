// Major Indian cities organized by state/UT
// Format: "City, State" for clear disambiguation

const INDIAN_LOCATIONS: string[] = [
  // Andhra Pradesh
  "Visakhapatnam, Andhra Pradesh",
  "Vijayawada, Andhra Pradesh",
  "Guntur, Andhra Pradesh",
  "Nellore, Andhra Pradesh",
  "Kurnool, Andhra Pradesh",
  "Tirupati, Andhra Pradesh",
  "Rajahmundry, Andhra Pradesh",
  "Kakinada, Andhra Pradesh",
  "Anantapur, Andhra Pradesh",
  "Eluru, Andhra Pradesh",

  // Arunachal Pradesh
  "Itanagar, Arunachal Pradesh",

  // Assam
  "Guwahati, Assam",
  "Silchar, Assam",
  "Dibrugarh, Assam",
  "Jorhat, Assam",
  "Tezpur, Assam",

  // Bihar
  "Patna, Bihar",
  "Gaya, Bihar",
  "Bhagalpur, Bihar",
  "Muzaffarpur, Bihar",
  "Darbhanga, Bihar",
  "Purnia, Bihar",
  "Arrah, Bihar",

  // Chhattisgarh
  "Raipur, Chhattisgarh",
  "Bhilai, Chhattisgarh",
  "Bilaspur, Chhattisgarh",
  "Korba, Chhattisgarh",
  "Durg, Chhattisgarh",

  // Delhi
  "New Delhi, Delhi",
  "Delhi, Delhi",

  // Goa
  "Panaji, Goa",
  "Margao, Goa",
  "Vasco da Gama, Goa",

  // Gujarat
  "Ahmedabad, Gujarat",
  "Surat, Gujarat",
  "Vadodara, Gujarat",
  "Rajkot, Gujarat",
  "Bhavnagar, Gujarat",
  "Jamnagar, Gujarat",
  "Junagadh, Gujarat",
  "Gandhinagar, Gujarat",
  "Anand, Gujarat",
  "Nadiad, Gujarat",
  "Morbi, Gujarat",
  "Mehsana, Gujarat",
  "Bharuch, Gujarat",

  // Haryana
  "Gurugram, Haryana",
  "Faridabad, Haryana",
  "Panipat, Haryana",
  "Ambala, Haryana",
  "Karnal, Haryana",
  "Hisar, Haryana",
  "Rohtak, Haryana",
  "Sonipat, Haryana",

  // Himachal Pradesh
  "Shimla, Himachal Pradesh",
  "Dharamshala, Himachal Pradesh",
  "Manali, Himachal Pradesh",
  "Solan, Himachal Pradesh",

  // Jharkhand
  "Ranchi, Jharkhand",
  "Jamshedpur, Jharkhand",
  "Dhanbad, Jharkhand",
  "Bokaro, Jharkhand",
  "Hazaribagh, Jharkhand",

  // Karnataka
  "Bengaluru, Karnataka",
  "Mysuru, Karnataka",
  "Mangaluru, Karnataka",
  "Hubli, Karnataka",
  "Belgaum, Karnataka",
  "Davangere, Karnataka",
  "Gulbarga, Karnataka",
  "Shimoga, Karnataka",
  "Tumkur, Karnataka",
  "Udupi, Karnataka",

  // Kerala
  "Thiruvananthapuram, Kerala",
  "Kochi, Kerala",
  "Kozhikode, Kerala",
  "Thrissur, Kerala",
  "Kollam, Kerala",
  "Palakkad, Kerala",
  "Kannur, Kerala",
  "Alappuzha, Kerala",
  "Kottayam, Kerala",

  // Madhya Pradesh
  "Bhopal, Madhya Pradesh",
  "Indore, Madhya Pradesh",
  "Jabalpur, Madhya Pradesh",
  "Gwalior, Madhya Pradesh",
  "Ujjain, Madhya Pradesh",
  "Sagar, Madhya Pradesh",
  "Dewas, Madhya Pradesh",
  "Satna, Madhya Pradesh",

  // Maharashtra
  "Mumbai, Maharashtra",
  "Pune, Maharashtra",
  "Nagpur, Maharashtra",
  "Thane, Maharashtra",
  "Nashik, Maharashtra",
  "Aurangabad, Maharashtra",
  "Solapur, Maharashtra",
  "Kolhapur, Maharashtra",
  "Amravati, Maharashtra",
  "Navi Mumbai, Maharashtra",
  "Vasai-Virar, Maharashtra",
  "Sangli, Maharashtra",
  "Latur, Maharashtra",
  "Akola, Maharashtra",

  // Manipur
  "Imphal, Manipur",

  // Meghalaya
  "Shillong, Meghalaya",

  // Mizoram
  "Aizawl, Mizoram",

  // Nagaland
  "Dimapur, Nagaland",
  "Kohima, Nagaland",

  // Odisha
  "Bhubaneswar, Odisha",
  "Cuttack, Odisha",
  "Rourkela, Odisha",
  "Berhampur, Odisha",
  "Sambalpur, Odisha",

  // Punjab
  "Ludhiana, Punjab",
  "Amritsar, Punjab",
  "Jalandhar, Punjab",
  "Patiala, Punjab",
  "Bathinda, Punjab",
  "Mohali, Punjab",

  // Rajasthan
  "Jaipur, Rajasthan",
  "Jodhpur, Rajasthan",
  "Udaipur, Rajasthan",
  "Kota, Rajasthan",
  "Bikaner, Rajasthan",
  "Ajmer, Rajasthan",
  "Alwar, Rajasthan",
  "Bhilwara, Rajasthan",
  "Sikar, Rajasthan",

  // Sikkim
  "Gangtok, Sikkim",

  // Tamil Nadu
  "Chennai, Tamil Nadu",
  "Coimbatore, Tamil Nadu",
  "Madurai, Tamil Nadu",
  "Tiruchirappalli, Tamil Nadu",
  "Salem, Tamil Nadu",
  "Tirunelveli, Tamil Nadu",
  "Erode, Tamil Nadu",
  "Vellore, Tamil Nadu",
  "Thoothukudi, Tamil Nadu",
  "Thanjavur, Tamil Nadu",
  "Tiruppur, Tamil Nadu",

  // Telangana
  "Hyderabad, Telangana",
  "Warangal, Telangana",
  "Nizamabad, Telangana",
  "Karimnagar, Telangana",
  "Khammam, Telangana",

  // Tripura
  "Agartala, Tripura",

  // Uttar Pradesh
  "Lucknow, Uttar Pradesh",
  "Kanpur, Uttar Pradesh",
  "Agra, Uttar Pradesh",
  "Varanasi, Uttar Pradesh",
  "Prayagraj, Uttar Pradesh",
  "Meerut, Uttar Pradesh",
  "Noida, Uttar Pradesh",
  "Ghaziabad, Uttar Pradesh",
  "Greater Noida, Uttar Pradesh",
  "Aligarh, Uttar Pradesh",
  "Bareilly, Uttar Pradesh",
  "Moradabad, Uttar Pradesh",
  "Gorakhpur, Uttar Pradesh",
  "Jhansi, Uttar Pradesh",
  "Mathura, Uttar Pradesh",
  "Firozabad, Uttar Pradesh",

  // Uttarakhand
  "Dehradun, Uttarakhand",
  "Haridwar, Uttarakhand",
  "Roorkee, Uttarakhand",
  "Haldwani, Uttarakhand",

  // West Bengal
  "Kolkata, West Bengal",
  "Howrah, West Bengal",
  "Durgapur, West Bengal",
  "Asansol, West Bengal",
  "Siliguri, West Bengal",
  "Bardhaman, West Bengal",
  "Kharagpur, West Bengal",

  // Union Territories
  "Chandigarh, Chandigarh",
  "Puducherry, Puducherry",
  "Jammu, Jammu & Kashmir",
  "Srinagar, Jammu & Kashmir",

  // States only (for broader selection)
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Chandigarh",
  "Puducherry",
  "Jammu & Kashmir",
];

export default INDIAN_LOCATIONS;
