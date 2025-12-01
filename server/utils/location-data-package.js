import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive location data
const locationData = {
  'India': {
    code: 'IN',
    states: {
      'Andhra Pradesh': {
        code: 'AP',
        cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kadapa', 'Kakinada', 'Anantapur', 'Tirupati', 'Chittoor', 'Eluru', 'Ongole', 'Machilipatnam', 'Adoni']
      },
      'Assam': {
        code: 'AS',
        cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Bongaigaon', 'Tinsukia', 'Tezpur', 'Nagaon', 'Karimganj', 'Sibsagar']
      },
      'Bihar': {
        code: 'BR',
        cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Danapur', 'Saharsa', 'Hajipur']
      },
      'Chhattisgarh': {
        code: 'CG',
        cities: ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund']
      },
      'Goa': {
        code: 'GA',
        cities: ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim']
      },
      'Gujarat': {
        code: 'GJ',
        cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Surendranagar', 'Bharuch', 'Mehsana', 'Bhuj', 'Porbandar', 'Palanpur', 'Valsad', 'Vapi', 'Godhra', 'Veraval', 'Petlad', 'Dahod', 'Botad']
      },
      'Haryana': {
        code: 'HR',
        cities: ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar', 'Kaithal', 'Palwal', 'Rewari', 'Hansi', 'Narnaul']
      },
      'Himachal Pradesh': {
        code: 'HP',
        cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib', 'Sundarnagar', 'Chamba']
      },
      'Jharkhand': {
        code: 'JH',
        cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar']
      },
      'Karnataka': {
        code: 'KA',
        cities: ['Bangalore', 'Mysore', 'Hubli-Dharwad', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga', 'Tumkur', 'Raichur', 'Bidar', 'Hospet', 'Hassan', 'Gadag-Betigeri', 'Udupi', 'Bagalkot', 'Bhadravati', 'Karwar']
      },
      'Kerala': {
        code: 'KL',
        cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Alappuzha', 'Palakkad', 'Kannur', 'Kasaragod', 'Kottayam', 'Malappuram', 'Pathanamthitta', 'Idukki', 'Ernakulam', 'Wayanad']
      },
      'Madhya Pradesh': {
        code: 'MP',
        cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Chhatarpur']
      },
      'Maharashtra': {
        code: 'MH',
        cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Malegaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalgaon', 'Bhusawal', 'Panvel', 'Satara', 'Beed', 'Yavatmal', 'Kamptee', 'Gondia', 'Barshi', 'Achalpur', 'Osmanabad', 'Nanded', 'Wardha']
      },
      'Manipur': {
        code: 'MN',
        cities: ['Imphal', 'Thoubal', 'Lilong', 'Mayang Imphal']
      },
      'Meghalaya': {
        code: 'ML',
        cities: ['Shillong', 'Tura', 'Nongstoin', 'Jowai']
      },
      'Mizoram': {
        code: 'MZ',
        cities: ['Aizawl', 'Lunglei', 'Saiha', 'Champhai']
      },
      'Nagaland': {
        code: 'NL',
        cities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang']
      },
      'Odisha': {
        code: 'OR',
        cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda']
      },
      'Punjab': {
        code: 'PB',
        cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala', 'Zirakpur', 'Kot Kapura']
      },
      'Rajasthan': {
        code: 'RJ',
        cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur', 'Sikar', 'Bhilwara', 'Pali', 'Sri Ganganagar', 'Kishangarh', 'Baran', 'Dhaulpur', 'Tonk', 'Beawar', 'Hanumangarh']
      },
      'Sikkim': {
        code: 'SK',
        cities: ['Gangtok', 'Namchi', 'Geyzing', 'Mangan']
      },
      'Tamil Nadu': {
        code: 'TN',
        cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumarakonam', 'Karaikkudi', 'Neyveli', 'Cuddalore', 'Kumbakonam', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Gudiyatham', 'Pudukkottai', 'Vaniyambadi']
      },
      'Telangana': {
        code: 'TG',
        cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Jagtial', 'Mancherial', 'Nirmal', 'Kothagudem', 'Bodhan', 'Sangareddy', 'Metpally', 'Zahirabad', 'MedChal']
      },
      'Tripura': {
        code: 'TR',
        cities: ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Belonia', 'Khowai']
      },
      'Uttar Pradesh': {
        code: 'UP',
        cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Mau', 'Hapur', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras', 'Banda', 'Pilibhit']
      },
      'Uttarakhand': {
        code: 'UK',
        cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani-cum-Kathgodam', 'Rudrapur', 'Kashipur', 'Rishikesh']
      },
      'West Bengal': {
        code: 'WB',
        cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Barasat', 'Raiganj', 'Kharagpur', 'Haldia', 'Nabadwip', 'Medinipur', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura', 'Chakdaha', 'Darjeeling', 'Alipurduar', 'Purulia', 'Jangipur', 'Bolpur', 'Bangaon', 'CoochBehar']
      },
      'Delhi': {
        code: 'DL',
        cities: ['New Delhi', 'Delhi', 'Faridabad', 'Ghaziabad', 'Gurgaon', 'Noida', 'Bahadurgarh', 'Sonipat', 'Panipat']
      }
    }
  },
  'United States': {
    code: 'US',
    states: {
      'California': {
        code: 'CA',
        cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Chula Vista', 'Fremont', 'San Bernardino', 'Modesto', 'Fontana', 'Oxnard', 'Moreno Valley', 'Huntington Beach', 'Glendale', 'Santa Clarita', 'Garden Grove']
      },
      'Texas': {
        code: 'TX',
        cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo', 'Lubbock', 'Garland', 'Irving', 'Amarillo', 'Grand Prairie', 'Brownsville', 'McKinney', 'Frisco', 'Pasadena', 'Killeen']
      },
      'Florida': {
        code: 'FL',
        cities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral', 'Pembroke Pines', 'Hollywood', 'Miramar', 'Gainesville', 'Coral Springs', 'Miami Gardens', 'Clearwater', 'Palm Bay', 'West Palm Beach', 'Lakeland']
      },
      'New York': {
        code: 'NY',
        cities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica', 'White Plains', 'Hempstead', 'Troy', 'Niagara Falls', 'Binghamton', 'Freeport', 'Valley Stream']
      },
      'Illinois': {
        code: 'IL',
        cities: ['Chicago', 'Aurora', 'Joliet', 'Naperville', 'Rockford', 'Elgin', 'Peoria', 'Champaign', 'Waukegan', 'Cicero', 'Bloomington', 'Arlington Heights', 'Evanston', 'Decatur', 'Schaumburg', 'Bolingbrook', 'Palatine', 'Skokie', 'Des Plaines', 'Orland Park']
      }
    }
  },
  'United Kingdom': {
    code: 'UK',
    states: {
      'England': {
        code: 'ENG',
        cities: ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Sheffield', 'Bristol', 'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford', 'Stoke-on-Trent', 'Wolverhampton', 'Plymouth', 'Derby', 'Southampton', 'Portsmouth', 'Brighton', 'Reading', 'Northampton']
      },
      'Scotland': {
        code: 'SCT',
        cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling', 'Perth', 'Inverness', 'Paisley', 'East Kilbride', 'Livingston']
      },
      'Wales': {
        code: 'WLS',
        cities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Bridgend', 'Neath', 'Port Talbot', 'Cwmbran']
      },
      'Northern Ireland': {
        code: 'NIR',
        cities: ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon', 'Castlereagh', 'Ballymena', 'Newtownards', 'Carrickfergus']
      }
    }
  },
  'Canada': {
    code: 'CA',
    states: {
      'Ontario': {
        code: 'ON',
        cities: ['Toronto', 'Ottawa', 'Hamilton', 'London', 'Kitchener', 'Windsor', 'Oshawa', 'Barrie', 'St. Catharines', 'Cambridge', 'Kingston', 'Guelph', 'Thunder Bay', 'Sudbury', 'Peterborough']
      },
      'Quebec': {
        code: 'QC',
        cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Trois-Rivières', 'Saint-Jean-sur-Richelieu', 'Terrebonne']
      },
      'British Columbia': {
        code: 'BC',
        cities: ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford', 'Coquitlam', 'Kelowna', 'Saanich', 'Langley', 'Delta', 'North Vancouver', 'Kamloops', 'Nanaimo', 'Victoria', 'Chilliwack']
      },
      'Alberta': {
        code: 'AB',
        cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie', 'Airdrie', 'Spruce Grove', 'Leduc']
      }
    }
  },
  'Australia': {
    code: 'AU',
    states: {
      'New South Wales': {
        code: 'NSW',
        cities: ['Sydney', 'Newcastle', 'Wollongong', 'Maitland', 'Wagga Wagga', 'Albury', 'Port Macquarie', 'Tamworth', 'Orange', 'Dubbo']
      },
      'Victoria': {
        code: 'VIC',
        cities: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Warrnambool', 'Wodonga', 'Traralgon', 'Mildura', 'Frankston']
      },
      'Queensland': {
        code: 'QLD',
        cities: ['Brisbane', 'Gold Coast', 'Townsville', 'Cairns', 'Toowoomba', 'Rockhampton', 'Mackay', 'Bundaberg', 'Hervey Bay', 'Gladstone']
      },
      'Western Australia': {
        code: 'WA',
        cities: ['Perth', 'Fremantle', 'Rockingham', 'Mandurah', 'Bunbury', 'Kalgoorlie', 'Geraldton', 'Albany', 'Broome', 'Port Hedland']
      },
      'South Australia': {
        code: 'SA',
        cities: ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Augusta', 'Port Pirie', 'Victor Harbor', 'Gawler', 'Port Lincoln', 'Kadina']
      }
    }
  },
  'Vietnam': {
    code: 'VN',
    states: {
      'Hanoi': {
        code: 'HN',
        cities: ['Hanoi City', 'Ba Dinh', 'Hoan Kiem', 'Hai Ba Trung', 'Dong Da', 'Tay Ho', 'Long Bien', 'Nam Tu Liem', 'Bac Tu Liem', 'Thanh Xuan', 'Cau Giay', 'Ha Dong', 'Son Tay', 'Ba Vi', 'Phuc Tho', 'Dan Phuong', 'Hoai Duc', 'Quoc Oai', 'Thach That', 'Chuong My', 'Thanh Oai', 'Thuong Tin', 'Phu Xuyen', 'Ung Hoa', 'My Duc', 'Soc Son', 'Dong Anh', 'Me Linh']
      },
      'Ho Chi Minh City': {
        code: 'SG',
        cities: ['Ho Chi Minh City', 'District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 6', 'District 7', 'District 8', 'District 9', 'District 10', 'District 11', 'District 12', 'Binh Thanh', 'Go Vap', 'Phu Nhuan', 'Tan Binh', 'Tan Phu', 'Thu Duc', 'Binh Tan', 'Hoc Mon', 'Cu Chi', 'Can Gio']
      },
      'Da Nang': {
        code: 'DN',
        cities: ['Da Nang City', 'Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son', 'Lien Chieu', 'Cam Le', 'Hoa Vang', 'Hoang Sa']
      },
      'Hai Phong': {
        code: 'HP',
        cities: ['Hai Phong City', 'Hong Bang', 'Ngo Quyen', 'Le Chan', 'Hai An', 'Kien An', 'Do Son', 'Duong Kinh', 'Thuy Nguyen', 'An Duong', 'An Lao', 'Kien Thuy', 'Tien Lang', 'Vinh Bao', 'Cat Hai', 'Bach Long Vy']
      },
      'Can Tho': {
        code: 'CT',
        cities: ['Can Tho City', 'Ninh Kieu', 'Binh Thuy', 'Cai Rang', 'O Mon', 'Thot Not', 'Co Do', 'Vinh Thanh', 'Phong Dien', 'Thoi Lai']
      },
      'An Giang': {
        code: 'AG',
        cities: ['Long Xuyen', 'Chau Doc', 'Tan Chau', 'Phu Tan', 'Chau Phu', 'Thoai Son', 'Tri Ton', 'Cho Moi', 'Ba Hon', 'Tinh Bien', 'An Phu']
      },
      'Ba Ria - Vung Tau': {
        code: 'BR',
        cities: ['Vung Tau', 'Ba Ria', 'Chau Duc', 'Xuyen Moc', 'Long Dien', 'Dat Do', 'Tan Thanh', 'Con Dao']
      },
      'Bac Giang': {
        code: 'BG',
        cities: ['Bac Giang', 'Yen The', 'Tan Yen', 'Viet Yen', 'Hiep Hoa', 'Luc Nam', 'Luc Ngan', 'Son Dong', 'Yen Dung', 'Lang Giang']
      },
      'Bac Kan': {
        code: 'BK',
        cities: ['Bac Kan', 'Pac Nam', 'Bach Thong', 'Cho Don', 'Cho Moi', 'Na Ri', 'Ngan Son']
      },
      'Bac Lieu': {
        code: 'BL',
        cities: ['Bac Lieu', 'Hong Dan', 'Phuoc Long', 'Vinh Loi', 'Gia Rai', 'Dong Hai', 'Hoa Binh']
      },
      'Bac Ninh': {
        code: 'BN',
        cities: ['Bac Ninh', 'Tu Son', 'Tien Du', 'Que Vo', 'Yen Phong', 'Luong Tai', 'Thuan Thanh', 'Gia Binh']
      },
      'Ben Tre': {
        code: 'BT',
        cities: ['Ben Tre', 'Chau Thanh', 'Cho Lach', 'Mo Cay Nam', 'Giong Trom', 'Binh Dai', 'Ba Tri', 'Thanh Phu', 'Mo Cay Bac']
      },
      'Binh Dinh': {
        code: 'BD',
        cities: ['Quy Nhon', 'An Nhon', 'Tuy Phuoc', 'Phu Cat', 'Phu My', 'Vinh Thanh', 'Tay Son', 'Hoai Nhon', 'Hoai An', 'An Lao', 'Van Canh']
      },
      'Binh Duong': {
        code: 'BI',
        cities: ['Thu Dau Mot', 'Ben Cat', 'Tan Uyen', 'Dau Tieng', 'Bau Bang', 'Phu Giao', 'Bacau', 'Di An', 'Thuan An']
      },
      'Binh Phuoc': {
        code: 'BP',
        cities: ['Dong Xoai', 'Binh Long', 'Phuoc Long', 'Bu Dang', 'Loc Ninh', 'Bu Dop', 'Hon Quan', 'Dong Phu', 'Bu Gia Map', 'Chon Thanh', 'Phu Rieng']
      },
      'Binh Thuan': {
        code: 'BU',
        cities: ['Phan Thiet', 'La Gi', 'Tuy Phong', 'Bac Binh', 'Ham Thuan Bac', 'Ham Thuan Nam', 'Tanh Linh', 'Duc Linh', 'Ham Tan', 'Phu Quy']
      },
      'Ca Mau': {
        code: 'CM',
        cities: ['Ca Mau', 'U Minh', 'Thoi Binh', 'Tran Van Thoi', 'Cai Nuoc', 'Dam Doi', 'Ngoc Hien', 'Phu Tan', 'Nam Can']
      },
      'Cao Bang': {
        code: 'CB',
        cities: ['Cao Bang', 'Bao Lac', 'Bao Lam', 'Thong Nong', 'Ha Quang', 'Tra Linh', 'Trung Khanh', 'Hoa An', 'Nguyen Binh', 'Phuc Hoa', 'Quang Uyen']
      },
      'Dak Lak': {
        code: 'DL',
        cities: ['Buon Ma Thuot', 'Buon Ho', 'Ea Kar', 'Ea Sup', 'Krong Buk', 'Krong Nang', 'Ea Hleo', 'Lak', 'Cư Kuin', 'Krong Bong', 'Krong Pac', 'Krong A Na', 'Lak', 'M Drak']
      },
      'Dak Nong': {
        code: 'DK',
        cities: ['Gia Nghia', 'Dak Mil', 'Cu Jut', 'Dak Song', 'Dak Glong', 'Krong No', 'Tuy Duc']
      },
      'Dien Bien': {
        code: 'DB',
        cities: ['Dien Bien Phu', 'Muong Lay', 'Muong Nhe', 'Muong Cha', 'Tuan Giao', 'Muong Ang', 'Dien Bien', 'Dien Bien Dong', 'Muong Nhe', 'Na Hang']
      },
      'Dong Nai': {
        code: 'DG',
        cities: ['Bien Hoa', 'Long Khanh', 'Trang Bom', 'Vinh Cuu', 'Long Thanh', 'Cam My', 'Xuan Loc', 'Thong Nhat', 'Dinh Quan', 'Tan Phu', 'Nhon Trach']
      },
      'Dong Thap': {
        code: 'DT',
        cities: ['Cao Lanh', 'Sa Dec', 'Hong Ngu', 'Tan Hong', 'Chau Thanh', 'Tam Nong', 'Thanh Binh', 'Tien Giang', 'Lai Vung', 'Lấp Vo', 'Thap Muoi']
      },
      'Gia Lai': {
        code: 'GL',
        cities: ['Pleiku', 'An Khe', 'Ayun Pa', 'Kbang', 'Krong Pa', 'Kông Chro', 'Duc Co', 'Chu Pah', 'Ia Grai', 'Mang Yang', 'Kong Chro', 'Chu Se', 'Dak Doa', 'Chu Prong', 'Dak Po', 'Ia Pa', 'Krong Chro']
      },
      'Ha Giang': {
        code: 'HG',
        cities: ['Ha Giang', 'Dong Van', 'Meo Vac', 'Yen Minh', 'Quan Ba', 'Vi Xuyen', 'Bac Me', 'Hoang Su Phi', 'Xin Man', 'Bac Quang', 'Duc Me']
      },
      'Ha Nam': {
        code: 'HM',
        cities: ['Phu Ly', 'Duy Tien', 'Kim Bang', 'Thanh Liem', 'Binh Luc', 'Ly Nhan']
      },
      'Ha Tinh': {
        code: 'HT',
        cities: ['Ha Tinh', 'Hong Linh', 'Huong Son', 'Duc Tho', 'Vu Quang', 'Nghi Xuan', 'Can Loc', 'Thach Ha', 'Cam Xuyen', 'Ky Anh', 'Huong Khe', 'Thach Ha', 'Loc Ha']
      },
      'Hai Duong': {
        code: 'HD',
        cities: ['Hai Duong', 'Chí Linh', 'Nam Sach', 'Kinh Mon', 'Kim Thanh', 'Thanh Ha', 'Cam Giang', 'Binh Giang', 'Gia Loc', 'Thanh Mien', 'Tu Ky', 'Ninh Giang']
      },
      'Hau Giang': {
        code: 'HU',
        cities: ['Vi Thanh', 'Nga Bay', 'Chau Thanh A', 'Chau Thanh', 'Phung Hiep', 'Vi Thuy', 'Long My']
      },
      'Hoa Binh': {
        code: 'HB',
        cities: ['Hoa Binh', 'Da Bac', 'Luong Son', 'Kim Boi', 'Cao Phong', 'Tan Lac', 'Mai Chau', 'Lac Son', 'Yen Thuy', 'Lac Thuy']
      },
      'Hung Yen': {
        code: 'HY',
        cities: ['Hung Yen', 'Van Lam', 'Van Giang', 'Yen My', 'My Hao', 'Ân Thi', 'Khoai Chau', 'Kim Dong', 'Tien Lu', 'Phu Cu']
      },
      'Khanh Hoa': {
        code: 'KH',
        cities: ['Nha Trang', 'Cam Ranh', 'Cam Lam', 'Van Ninh', 'Ninh Hoa', 'Khanh Vinh', 'Dien Khanh', 'Khanh Son', 'Truong Sa']
      },
      'Kien Giang': {
        code: 'KG',
        cities: ['Rach Gia', 'Ha Tien', 'Phu Quoc', 'Hon Dat', 'Tan Hiep', 'Chau Thanh', 'Giong Rieng', 'Go Quao', 'An Bien', 'An Minh', 'Vinh Thuan', 'Kien Hai', 'U Minh Thuong', 'Giang Thanh', 'Kien Luong']
      },
      'Kon Tum': {
        code: 'KT',
        cities: ['Kon Tum', 'Dak Glei', 'Ngọc Hoi', 'Dak To', 'Kon Plong', 'Kon Ray', 'Dak Ha', 'Sa Thay', 'Tu Mo Rong', 'Ia H Drai']
      },
      'Lai Chau': {
        code: 'LC',
        cities: ['Lai Chau', 'Tam Duong', 'Muong Te', 'Sin Ho', 'Phong Tho', 'Than Uyen', 'Tan Uyen', 'Noong Het']
      },
      'Lam Dong': {
        code: 'LD',
        cities: ['Da Lat', 'Bao Loc', 'Duc Trong', 'Lac Duong', 'Lam Ha', 'Don Duong', 'Dam Rong', 'Di Linh', 'Bao Lam', 'Da Huoai', 'Da Teh', 'Cat Tien']
      },
      'Lang Son': {
        code: 'LS',
        cities: ['Lang Son', 'Trang Dinh', 'Binh Gia', 'Van Lang', 'Cao Loc', 'Van Quan', 'Bac Son', 'Huu Lung', 'Chi Lang', 'Loc Binh', 'Dinh Lap']
      },
      'Lao Cai': {
        code: 'LO',
        cities: ['Lao Cai', 'Sa Pa', 'Van Ban', 'Bac Ha', 'Muong Khuong', 'Si Ma Cai', 'Bao Thang', 'Bao Yen', 'Bat Xat']
      },
      'Long An': {
        code: 'LA',
        cities: ['Tan An', 'Kien Tuong', 'Tan Hung', 'Vinhung', 'Moc Hoa', 'Tan Thanh', 'Thu Thua', 'Ben Luc', 'Thanh Hoa', 'Can Duoc', 'Can Giuoc', 'Chau Thanh', 'Duc Hue', 'Duc Hoa', 'Tay Ninh']
      },
      'Nam Dinh': {
        code: 'ND',
        cities: ['Nam Dinh', 'My Loc', 'Vụ Ban', 'Y Yen', 'Nghia Hung', 'Nam Truc', 'Truc Ninh', 'Xuan Truong', 'Giao Thuy', 'Hai Hau']
      },
      'Nghe An': {
        code: 'NA',
        cities: ['Vinh', 'Cua Lo', 'Thai Hoa', 'Quynh Lưu', 'Yen Thanh', 'Dien Chau', 'Do Luong', 'Thanh Chuong', 'Nghi Loc', 'Nam Dan', 'Hung Nguyen', 'Nghia Dan', 'Quy Chau', 'Quy Hop', 'Que Phong', 'Tuong Duong', 'Nghia Dan', 'Anh Son', 'Con Cuong', 'Tan Ky', 'Ky Son']
      },
      'Ninh Binh': {
        code: 'NB',
        cities: ['Ninh Binh', 'Tam Diep', 'Nho Quan', 'Gia Vien', 'Hoa Lu', 'Yên Khanh', 'Kim Son', 'Yen Mo']
      },
      'Ninh Thuan': {
        code: 'NT',
        cities: ['Phan Rang-Thap Cham', 'Ninh Son', 'Ninh Hai', 'Ninh Phuoc', 'Bac Ai', 'Thuan Bac', 'Thuan Nam']
      },
      'Phu Tho': {
        code: 'PT',
        cities: ['Viet Tri', 'Phu Tho', 'Doan Hung', 'Hạ Hoa', 'Thanh Ba', 'Phu Ninh', 'Yen Lap', 'Cam Khe', 'Tam Nong', 'Lam Thao', 'Thanh Son', 'Thanh Thuy', 'Tân Son']
      },
      'Phu Yen': {
        code: 'PY',
        cities: ['Tuy Hoa', 'Dong Hoa', 'Tuy An', 'Son Hoa', 'Song Hinh', 'Tay Hoa', 'Phu Hoa', 'Dong Xuan', 'Song Cau']
      },
      'Quang Binh': {
        code: 'QB',
        cities: ['Dong Hoi', 'Ba Don', 'Quang Trach', 'Bo Trach', 'Quang Ninh', 'Le Thuy', 'Tuyen Hoa', 'Minh Hoa']
      },
      'Quang Nam': {
        code: 'QM',
        cities: ['Tam Ky', 'Hoi An', 'Thang Binh', 'Chau O', 'Tien Phuoc', 'Duy Xuyen', 'Dai Loc', 'Dien Ban', 'Que Son', 'Hiep Duc', 'Phuoc Son', 'Nam Giang', 'Bac Tra My', 'Nam Tra My', 'Dong Giang', 'Tay Giang', 'Phu Ninh']
      },
      'Quang Ngai': {
        code: 'QG',
        cities: ['Quang Ngai', 'Ba To', 'Binh Son', 'Tra Bong', 'Son Tinh', 'Tu Nghia', 'Son Ha', 'Son Tay', 'Minh Long', 'Nghia Hanh', 'Mo Duc', 'Duc Pho', 'Ba To', 'Ly Son']
      },
      'Quang Ninh': {
        code: 'QN',
        cities: ['Ha Long', 'Mong Cai', 'Cam Pha', 'Uong Bi', 'Dong Trieu', 'Quang Yen', 'Co To', 'Tien Yen', 'Dam Ha', 'Hai Ha', 'Ba Che', 'Van Don', 'Hoành Bo']
      },
      'Quang Tri': {
        code: 'QT',
        cities: ['Dong Ha', 'Quang Tri', 'Vinh Linh', 'Hương Hoa', 'Gio Linh', 'Cam Lo', 'Trieu Phong', 'Hai Lang', 'Cồn Cỏ']
      },
      'Soc Trang': {
        code: 'ST',
        cities: ['Soc Trang', 'Chau Thanh', 'Ke Sach', 'My Tu', 'Cu Lao Dung', 'Long Phu', 'My Xuyen', 'Nga Nam', 'Thạnh Tri', 'Vinh Chau', 'Tran De']
      },
      'Son La': {
        code: 'SL',
        cities: ['Son La', 'Quynh Nhai', 'Muong La', 'Yen Chau', 'Mai Son', 'Song Ma', 'Sop Cop', 'Van Ho', 'Bac Yen', 'Phu Yen', 'Moc Chau', 'Thuan Chau']
      },
      'Tay Ninh': {
        code: 'TN',
        cities: ['Tay Ninh', 'Hoa Thanh', 'Cao Su', 'Trang Bang', 'Tan Bien', 'Tan Chau', 'Duong Minh Chau', 'Chau Thanh', 'Ben Cau', 'Go Dau', 'Tan Bien']
      },
      'Thai Binh': {
        code: 'TB',
        cities: ['Thai Binh', 'Quynh Phu', 'Hung Ha', 'Dong Hung', 'Thai Thuy', 'Tien Hai', 'Kien Xuong', 'Vu Thu']
      },
      'Thai Nguyen': {
        code: 'TG',
        cities: ['Thai Nguyen', 'Song Cong', 'Dinh Hoa', 'Phu Luong', 'Dong Hy', 'Vo Nhai', 'Dai Tu', 'Pho Yen', 'Phu Binh']
      },
      'Thanh Hoa': {
        code: 'TH',
        cities: ['Thanh Hoa', 'Bim Son', 'Sam Son', 'Nga Son', 'Như Xuân', 'Như Thanh', 'Nong Cong', 'Dong Son', 'Yen Định', 'Thọ Xuân', 'Thường Xuân', 'Triệu Sơn', 'Thiệu Hóa', 'Hoàng Hóa', 'Hà Trung', 'Vĩnh Lộc', 'Cẩm Thủy', 'Quan Hóa', 'Bá Thước', 'Quan Sơn', 'Lang Chánh', 'Ngọc Lặc', 'Mường Lát', 'Thạch Thành', 'Hậu Lộc', 'Nga Sơn', 'Như Xuân', 'Như Thanh']
      },
      'Thua Thien Hue': {
        code: 'TT',
        cities: ['Hue', 'Phong Dien', 'Quang Dien', 'Phu Vang', 'Phu Loc', 'Nam Dong', 'A Luoi', 'Huong Thuy', 'Huong Tra']
      },
      'Tien Giang': {
        code: 'TI',
        cities: ['My Tho', 'Go Cong', 'Cai Lay', 'Tieu Can', 'Chau Thanh', 'Cho Gao', 'Go Cong Tay', 'Go Cong Dong', 'Tan Phuoc', 'Cai Be']
      },
      'Tra Vinh': {
        code: 'TV',
        cities: ['Tra Vinh', 'Binh Minh', 'Ba Tri', 'Mo Cay', 'Chau Thanh', 'Cang Long', 'Cau Ke', 'Tieu Can', 'Duyen Hai']
      },
      'Tuyen Quang': {
        code: 'TQ',
        cities: ['Tuyen Quang', 'Yen Son', 'Son Duong', 'Ham Yen', 'Chiem Hoa', 'Na Hang', 'Lam Binh']
      },
      'Vinh Long': {
        code: 'VL',
        cities: ['Vinh Long', 'Long Ho', 'Mang Thit', 'Vung Liem', 'Tam Binh', 'Binh Minh', 'Tra On', 'Binh Tan']
      },
      'Vinh Phuc': {
        code: 'VP',
        cities: ['Vinh Yen', 'Phuc Yen', 'Lap Thach', 'Tam Dao', 'Tam Duong', 'Vinh Tuong', 'Yen Lac', 'Me Linh', 'Binh Xuyen', 'Song Lo']
      },
      'Yen Bai': {
        code: 'YB',
        cities: ['Yen Bai', 'Nghia Lo', 'Luc Yen', 'Van Yen', 'Yen Binh', 'Tran Yen', 'Tam Duong', 'Mu Cang Chai', 'Than Uyen']
      }
    }
  }
};

async function insertLocationData() {
  // console.log('🌍 Starting comprehensive location data insertion...');
  
  try {
    const insertedData = {
      countries: 0,
      states: 0,
      cities: 0
    };

    for (const [countryName, countryInfo] of Object.entries(locationData)) {
      // console.log(`\n📍 Processing ${countryName}...`);
      
      // Insert or update country
      const country = await prisma.country.upsert({
        where: { name: countryName },
        update: { code: countryInfo.code },
        create: {
          name: countryName,
          code: countryInfo.code,
          status: 1
        }
      });
      insertedData.countries++;
      // console.log(`✅ Country: ${countryName} (${countryInfo.code})`);

      // Process states
      for (const [stateName, stateInfo] of Object.entries(countryInfo.states)) {
        const state = await prisma.state.upsert({
          where: {
            name_countryId: {
              name: stateName,
              countryId: country.id
            }
          },
          update: { code: stateInfo.code },
          create: {
            name: stateName,
            code: stateInfo.code,
            countryId: country.id,
            status: 1
          }
        });
        insertedData.states++;
        // console.log(`  ✅ State: ${stateName} (${stateInfo.code || 'N/A'})`);

        // Process cities in batches for better performance
        const cities = stateInfo.cities;
        // console.log(`    🏙️ Processing ${cities.length} cities...`);
        
        for (const cityName of cities) {
          await prisma.city.upsert({
            where: {
              name_stateId: {
                name: cityName,
                stateId: state.id
              }
            },
            update: {},
            create: {
              name: cityName,
              stateId: state.id,
              status: 1
            }
          });
          insertedData.cities++;
        }
        // console.log(`    ✅ Added ${cities.length} cities to ${stateName}`);
      }
    }

    // console.log('\n🎉 Location data insertion completed!');
    // console.log(`📊 Summary:`);
    // console.log(`   Countries: ${insertedData.countries}`);
    // console.log(`   States/Provinces: ${insertedData.states}`);
    // console.log(`   Cities: ${insertedData.cities}`);
    // console.log(`   Total locations: ${insertedData.countries + insertedData.states + insertedData.cities}`);

    return insertedData;
  } catch (error) {
    console.error('❌ Error inserting location data:', error);
    throw error;
  }
}

export { insertLocationData, locationData };