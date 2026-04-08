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
          L71 40
          Q71 45 66.5 47.5
          Q60 51 53.5 47.5
          Q49 45 49 40
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
          Q44 66 46.5 61.5
          Q50 55 46.5 48.5
          Q44 44 39 44
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
          Q76 66 73.5 61.5
          Q70 55 73.5 48.5
          Q76 44 81 44
          Z
        "
        fill="#9FCB8B"
      />

      {/* element jos */}
      <path
        d="
          M49 72
          Q49 67 53.5 64.5
          Q60 61 66.5 64.5
          Q71 67 71 72
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