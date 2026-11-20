  "use client";
  import Link from "next/link";
  import Image from "next/image";
  import { useSettingsContext } from "@/context/useSettingsContext";

  const DEFAULT_LOGO = "/images/logo.png";

  const AuthLogo = () => {
    const { setting } = useSettingsContext();

    return (
      <>
        <Link href="/" className="logo-dark">
          <Image 
            src={setting("general.logo_dark", setting("general.logo", DEFAULT_LOGO))} 
            alt="dark logo" 
            width={120}
            height={32} 
            style={{ objectFit: 'contain', width: 'auto' }}
            unoptimized
          />
        </Link>
        <Link href="/" className="logo-light">
          <Image 
            src={setting("general.logo", DEFAULT_LOGO)} 
            alt="logo" 
            width={120}
            height={32} 
            style={{ objectFit: 'contain', width: 'auto' }}
            unoptimized
          />
        </Link>
      </>
    );
  };

  export default AuthLogo;
