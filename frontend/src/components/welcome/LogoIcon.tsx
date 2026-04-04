export default function LogoIcon() {
  return (
    <svg
      className="welcome-logo"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* element sus */}
      <path
        d="
          M49 26
          C49 20 54 15 60 15
          C66 15 71 20 71 26
          L71 43
          L60 51
          L49 43
          Z
        "
        fill="#39A28D"
      />

      {/* element stanga */}
      <path
        d="
          M39 44
          L26 44
          C18 44 13 48 13 55
          C13 62 18 66 26 66
          L39 66
          L50 55
          Z
        "
        fill="#F28A38"
      />

      {/* element dreapta */}
      <path
        d="
          M81 44
          L94 44
          C102 44 107 48 107 55
          C107 62 102 66 94 66
          L81 66
          L70 55
          Z
        "
        fill="#9FCB8B"
      />

      {/* element jos */}
      <path
        d="
          M49 69
          L60 61
          L71 69
          L71 88
          C71 94 66 99 60 99
          C54 99 49 94 49 88
          Z
        "
        fill="#F3C05B"
      />
    </svg>
  );
}