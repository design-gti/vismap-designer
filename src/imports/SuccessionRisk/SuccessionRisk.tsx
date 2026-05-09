import svgPaths from "./svg-ldz3sypuyp";

function Frame5() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
      <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-end leading-[0] relative shrink-0 text-[#495057] text-[0px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="text-[12px]">
          <span className="font-['Avenir:Heavy',sans-serif] leading-[normal] not-italic text-[#495057]">12</span>
          <span className="leading-[normal]">/21 Succession Risk</span>
        </p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="chevron-down">
        <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector">
          <div className="absolute inset-[-15%_-7.5%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.5 6.5">
              <path d={svgPaths.p3d2c9380} id="Vector" stroke="var(--stroke-0, #58595B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start leading-[normal] relative shrink-0 w-full whitespace-nowrap">
      <p className="font-['Avenir:Heavy',sans-serif] not-italic relative shrink-0 text-[#016699] text-[12px]">Chief Marketing Officer</p>
      <p className="font-['Open_Sans:Regular',sans-serif] font-normal relative shrink-0 text-[#495057] text-[10px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Yolanda
      </p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[#f8f9fa] relative rounded-[4px] shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Frame />
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start leading-[normal] relative shrink-0 w-full whitespace-nowrap">
      <p className="font-['Avenir:Heavy',sans-serif] not-italic relative shrink-0 text-[#016699] text-[12px]">Product Manager Lead</p>
      <p className="font-['Open_Sans:Regular',sans-serif] font-normal relative shrink-0 text-[#495057] text-[10px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Novaria
      </p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[#f8f9fa] relative rounded-[4px] shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Frame1 />
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start leading-[normal] relative shrink-0 w-full whitespace-nowrap">
      <p className="font-['Avenir:Heavy',sans-serif] not-italic relative shrink-0 text-[#016699] text-[12px]">Product Design Lead</p>
      <p className="font-['Open_Sans:Regular',sans-serif] font-normal relative shrink-0 text-[#495057] text-[10px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Angela
      </p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-[#f8f9fa] relative rounded-[4px] shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Frame2 />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start leading-[normal] relative shrink-0 w-full whitespace-nowrap">
      <p className="font-['Avenir:Heavy',sans-serif] not-italic relative shrink-0 text-[#016699] text-[12px]">QA Lead</p>
      <p className="font-['Open_Sans:Regular',sans-serif] font-normal relative shrink-0 text-[#495057] text-[10px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Aurora
      </p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="bg-[#f8f9fa] relative rounded-[4px] shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Frame3 />
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start leading-[normal] relative shrink-0 w-full whitespace-nowrap">
      <p className="font-['Avenir:Heavy',sans-serif] not-italic relative shrink-0 text-[#016699] text-[12px]">HR Operations Lead</p>
      <p className="font-['Open_Sans:Regular',sans-serif] font-normal relative shrink-0 text-[#495057] text-[10px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Diana
      </p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="bg-[#f8f9fa] relative rounded-[4px] shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
        <Frame4 />
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <Frame6 />
      <Frame7 />
      <Frame8 />
      <Frame9 />
      <Frame10 />
    </div>
  );
}

export default function SuccessionRisk() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[16px] items-start px-[16px] py-[12px] relative rounded-[8px] size-full" data-name="Succession Risk">
      <Frame5 />
      <Frame11 />
    </div>
  );
}