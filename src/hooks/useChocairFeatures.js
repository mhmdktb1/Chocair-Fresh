import { useEffect, useRef, useState } from "react";

export function useChocairFeatures() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const productRowsRef = useRef(new Map());

  useEffect(() => {
    // Header scroll effect
    const handleScroll = () => {
      const scrolled = window.scrollY > 80;
      setIsScrolled(scrolled);
    };

    // Only add scroll listener, don't trigger immediately
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const initProductRow = (element, id) => {
    if (!element) return;
    productRowsRef.current.set(id, element);
    let isDown = false;
    let startX;
    let scrollLeft;

    const handleMouseDown = (e) => {
      isDown = true;
      element.style.cursor = "grabbing";
      startX = e.pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
    };
    const handleMouseUp = () => {
      isDown = false;
      element.style.cursor = "grab";
    };
    const handleMouseMove = (e) => {
      if (!isDown) return;
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX) * 1.2;
      element.scrollLeft = scrollLeft - walk;
    };

    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("mouseup", handleMouseUp);
    element.addEventListener("mousemove", handleMouseMove);

    return () => {
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("mouseup", handleMouseUp);
      element.removeEventListener("mousemove", handleMouseMove);
    };
  };

  const handleSliderClick = (id, direction) => {
    const row = productRowsRef.current.get(id);
    if (!row) return;
    const scrollAmount = direction === "next" ? 300 : -300;
    row.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const initFadeUpReveal = (el) => {
    if (!el) return;
    el.classList.add("fade-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
  };

  return {
    isScrolled,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    initProductRow,
    handleSliderClick,
    initFadeUpReveal,
  };
}
