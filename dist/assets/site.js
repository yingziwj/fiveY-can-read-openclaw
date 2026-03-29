const toggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector("#mobile-nav");

if (toggle && mobileNav) {
  toggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}
