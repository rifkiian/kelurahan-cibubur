import { Ambulance, Shield, FireExtinguisher, PhoneCall } from "lucide-react"

const emergencyContacts = [
  {
    id: 1,
    name: "Ambulans",
    number: "118",
    icon: <Ambulance className="h-8 w-8" />,
    color: "bg-red-100 text-red-600"
  },
  {
    id: 2,
    name: "Polisi",
    number: "110",
    icon: <Shield className="h-8 w-8" />,
    color: "bg-blue-100 text-blue-600"
  },
  {
    id: 3,
    name: "Pemadam Kebakaran",
    number: "113",
    icon: <FireExtinguisher className="h-8 w-8" />,
    color: "bg-orange-100 text-orange-600"
  },
  {
    id: 4,
    name: "Puskesmas Cibubur",
    number: "(021) 8459 9999",
    icon: <PhoneCall className="h-8 w-8" />,
    color: "bg-green-100 text-green-600"
  },
  {
    id: 5,
    name: "Pos Kamling RW 01-10",
    number: "(021) 8459 8888",
    icon: <PhoneCall className="h-8 w-8" />,
    color: "bg-purple-100 text-purple-600"
  },
  {
    id: 6,
    name: "Layanan Pengaduan 24 Jam",
    number: "1500-123",
    icon: <PhoneCall className="h-8 w-8" />,
    color: "bg-yellow-100 text-yellow-600"
  }
]

export function EmergencyContacts() {
  return (
    <section className="py-16 bg-white" id="darurat">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Layanan Darurat</h2>
          <p className="text-gray-600">Nomor penting yang dapat dihubungi dalam keadaan darurat</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {emergencyContacts.map((contact) => (
            <div 
              key={contact.id}
              className="border rounded-lg p-6 hover:shadow-md transition-shadow duration-200 flex items-start space-x-4"
            >
              <div className={`${contact.color} p-3 rounded-full`}>
                {contact.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{contact.name}</h3>
                <a 
                  href={`tel:${contact.number}`}
                  className="text-orange-600 hover:text-orange-700 font-medium text-lg mt-1 inline-flex items-center"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  {contact.number}
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  {contact.id <= 3 
                    ? "Layanan 24 Jam" 
                    : contact.id === 4 
                      ? "Buka 24 Jam" 
                      : contact.id === 5 
                        ? "Buka 24 Jam" 
                        : "Layanan Pengaduan"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-orange-50 border border-orange-100 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-orange-800 mb-3">
            <span className="inline-flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Penting!
            </span>
          </h3>
          <p className="text-orange-700">
            Gunakan nomor darurat ini dengan bijak. Hubungi hanya dalam keadaan darurat yang sesungguhnya. 
            Penyalahgunaan dapat menghambat penanganan kasus yang benar-benar membutuhkan pertolongan.
          </p>
        </div>
      </div>
    </section>
  )
}
