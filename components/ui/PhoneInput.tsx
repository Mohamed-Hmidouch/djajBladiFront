'use client';

import { useState, useRef, useEffect, forwardRef, type InputHTMLAttributes } from 'react';

/* ============================================
   COUNTRY CODES DATA
   ============================================ */
export interface CountryCode {
  code: string;      // ISO code (MA, FR, US, etc.)
  name: string;      // Country name
  dialCode: string;  // Dial code (+212, +33, etc.)
  flag: string;      // Emoji flag
}

export const countryCodes: CountryCode[] = [
  // Maroc en premier (défaut)
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  
  // Afrique du Nord & Moyen-Orient
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬' },
  { code: 'LY', name: 'Libye', dialCode: '+218', flag: '🇱🇾' },
  { code: 'MR', name: 'Mauritanie', dialCode: '+222', flag: '🇲🇷' },
  { code: 'SA', name: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'Émirats Arabes Unis', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Koweït', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahreïn', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { code: 'JO', name: 'Jordanie', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Liban', dialCode: '+961', flag: '🇱🇧' },
  { code: 'SY', name: 'Syrie', dialCode: '+963', flag: '🇸🇾' },
  { code: 'IQ', name: 'Irak', dialCode: '+964', flag: '🇮🇶' },
  { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
  
  // Europe
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'AT', name: 'Autriche', dialCode: '+43', flag: '🇦🇹' },
  { code: 'PL', name: 'Pologne', dialCode: '+48', flag: '🇵🇱' },
  { code: 'SE', name: 'Suède', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norvège', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Danemark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlande', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Irlande', dialCode: '+353', flag: '🇮🇪' },
  { code: 'GR', name: 'Grèce', dialCode: '+30', flag: '🇬🇷' },
  { code: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'Russie', dialCode: '+7', flag: '🇷🇺' },
  
  // Amériques
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
  { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentine', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chili', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombie', dialCode: '+57', flag: '🇨🇴' },
  
  // Afrique
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  
  // Asie
  { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'Corée du Sud', dialCode: '+82', flag: '🇰🇷' },
  { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'ID', name: 'Indonésie', dialCode: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaisie', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapour', dialCode: '+65', flag: '🇸🇬' },
  { code: 'TH', name: 'Thaïlande', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  
  // Océanie
  { code: 'AU', name: 'Australie', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nouvelle-Zélande', dialCode: '+64', flag: '🇳🇿' },
];

/* ============================================
   PHONE INPUT COMPONENT
   ============================================ */

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (fullNumber: string) => void;
  defaultCountryCode?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, value = '', onChange, defaultCountryCode = 'MA', className = '', ...props }, ref) => {
    // Parse initial value to extract country code and number
    const parsePhoneNumber = (phone: string): { country: CountryCode; number: string } => {
      const defaultCountry = countryCodes.find(c => c.code === defaultCountryCode) || countryCodes[0];
      
      if (!phone) return { country: defaultCountry, number: '' };
      
      // Try to match dial code
      for (const country of countryCodes) {
        if (phone.startsWith(country.dialCode)) {
          return {
            country,
            number: phone.slice(country.dialCode.length).trim(),
          };
        }
      }
      
      return { country: defaultCountry, number: phone };
    };

    const parsed = parsePhoneNumber(value);
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(parsed.country);
    const [phoneNumber, setPhoneNumber] = useState(parsed.number);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter countries by search query
    const filteredCountries = countryCodes.filter(country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen]);

    // Notify parent of changes
    const handlePhoneChange = (newNumber: string) => {
      // Remove non-numeric characters except spaces
      const cleaned = newNumber.replace(/[^\d\s]/g, '');
      setPhoneNumber(cleaned);
      
      const fullNumber = cleaned ? `${selectedCountry.dialCode}${cleaned.replace(/\s/g, '')}` : '';
      onChange?.(fullNumber);
    };

    const handleCountrySelect = (country: CountryCode) => {
      setSelectedCountry(country);
      setIsOpen(false);
      setSearchQuery('');
      
      const fullNumber = phoneNumber ? `${country.dialCode}${phoneNumber.replace(/\s/g, '')}` : '';
      onChange?.(fullNumber);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text-body)] mb-2">
            {label}
          </label>
        )}
        
        <div className="relative flex">
          {/* Country Code Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`
                flex items-center gap-2 px-3 h-12
                bg-[var(--color-surface-2)] 
                border border-r-0 border-[var(--color-border)]
                rounded-l-[var(--radius-md)]
                hover:bg-[var(--color-surface-3)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20
                transition-colors
                ${error ? 'border-[var(--color-brand)]' : ''}
              `}
            >
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-sm font-medium text-[var(--color-text-body)]">
                {selectedCountry.dialCode}
              </span>
              <svg 
                className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute z-50 top-full left-0 mt-1 w-72 max-h-80 overflow-hidden bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg">
                {/* Search Input */}
                <div className="p-2 border-b border-[var(--color-border)]">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un pays..."
                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20"
                  />
                </div>
                
                {/* Country List */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      Aucun pays trouvé
                    </div>
                  ) : (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left
                          hover:bg-[var(--color-surface-2)] transition-colors
                          ${selectedCountry.code === country.code ? 'bg-[var(--color-brand)]/5' : ''}
                        `}
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="flex-1 text-sm text-[var(--color-text-body)]">
                          {country.name}
                        </span>
                        <span className="text-sm text-[var(--color-text-muted)]">
                          {country.dialCode}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Phone Number Input */}
          <input
            ref={ref}
            type="tel"
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="600 000 000"
            className={`
              flex-1 h-12 px-4
              bg-[var(--color-surface-1)]
              border border-[var(--color-border)]
              rounded-r-[var(--radius-md)]
              text-[var(--color-text-body)]
              placeholder:text-[var(--color-text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)]
              transition-all
              ${error ? 'border-[var(--color-brand)] focus:ring-[var(--color-brand)]/20' : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-brand)]">{error}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
