import React from 'react'

// // Source https://www.svgrepo.com/

// export default {

//     stopUrgentOutline: function ({ size = 14, fill = "black", stroke="black" }) {
//         return (
//             <svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
//                 <title>stop-urgent</title>
//                 <g id="Layer_2" data-name="Layer 2">
//                     <g id="invisible_box" data-name="invisible box">
//                         <rect width="{size}" height="{size}" fill="none" />
//                     </g>
//                     <g id="icons_Q2" data-name="icons Q2">
//                         <path d="M43.4,15.1,32.9,4.6A2,2,0,0,0,31.5,4h-15a2,2,0,0,0-1.4.6L4.6,15.1A2,2,0,0,0,4,16.5v15a2,2,0,0,0,.6,1.4L15.1,43.4a2,2,0,0,0,1.4.6h15a2,2,0,0,0,1.4-.6L43.4,32.9a2,2,0,0,0,.6-1.4v-15A2,2,0,0,0,43.4,15.1ZM40,30.6,30.6,40H17.4L8,30.6V17.4L17.4,8H30.6L40,17.4Z" />
//                         <path d="M24,28a2,2,0,0,0,2-2V16a2,2,0,0,0-4,0V26A2,2,0,0,0,24,28Z" />
//                         <circle cx="24" cy="32" r="2" />
//                     </g>
//                 </g>
//             </svg>
//         )
//     },
//     stopUrgentSolid: function ({ size = 14, fill = "black", stroke="black" }) {
//         return (
//             <svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
//                 <title>stop-urgent-solid</title>
//                 <g id="Layer_2" data-name="Layer 2">
//                     <g id="invisible_box" data-name="invisible box">
//                         <rect width="48" height="48" fill="none" />
//                     </g>
//                     <g id="icons_Q2" data-name="icons Q2">
//                         <path d="M43.4,15.1,32.9,4.6A2,2,0,0,0,31.5,4h-15a2,2,0,0,0-1.4.6L4.6,15.1A2,2,0,0,0,4,16.5v15a2,2,0,0,0,.6,1.4L15.1,43.4a2,2,0,0,0,1.4.6h15a2,2,0,0,0,1.4-.6L43.4,32.9a2,2,0,0,0,.6-1.4v-15A2,2,0,0,0,43.4,15.1ZM24,34a2,2,0,1,1,2-2A2,2,0,0,1,24,34Zm2-8a2,2,0,0,1-4,0V16a2,2,0,0,1,4,0Z" />
//                     </g>
//                 </g>
//             </svg>)
//     },
//     trust: function ({ size = 14, fill = "none", stroke="black" }) {
//         return (<svg height={size} width={size} fill={fill} stroke={color} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
//             <path d="M32 8c8.1 6.77 17.39 6.35 20.05 6.35C51.46 52.84 47 45.21 32 56c-15-10.79-19.45-3.16-20-41.65 2.59 0 11.88.42 20-6.35z" />
//         </svg>)
//     },
//     undo: function ({ size = 14, fill = "none", stroke="black" }) {
//         return (<svg height={size} width={size} fill={fill} stroke={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//             <path d="M17 13C16.5367 11.9961 15.7497 11.1655 14.7576 10.6333C13.7655 10.1011 12.622 9.89624 11.4994 10.0495C9.66479 10.3 8.38607 11.6116 7 12.8186M7 10V13H10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
//         </svg>)
//     },
// };

export function StopUrgent({ size = 18, fill = "none", stroke = "black" }) {
    return (
        <svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
                <g id="invisible_box" data-name="invisible box">
                    <rect width="{size}" height="{size}" fill="none" />
                </g>
                <g id="icons_Q2" data-name="icons Q2">
                    <path d="M43.4,15.1,32.9,4.6A2,2,0,0,0,31.5,4h-15a2,2,0,0,0-1.4.6L4.6,15.1A2,2,0,0,0,4,16.5v15a2,2,0,0,0,.6,1.4L15.1,43.4a2,2,0,0,0,1.4.6h15a2,2,0,0,0,1.4-.6L43.4,32.9a2,2,0,0,0,.6-1.4v-15A2,2,0,0,0,43.4,15.1ZM40,30.6,30.6,40H17.4L8,30.6V17.4L17.4,8H30.6L40,17.4Z" />
                    <path d="M24,28a2,2,0,0,0,2-2V16a2,2,0,0,0-4,0V26A2,2,0,0,0,24,28Z" />
                    <circle cx="24" cy="32" r="2" />
                </g>
            </g>
        </svg>
    )
}


export function Trust({ size = 18, fill = "none", stroke = "black" }) {
    return (<svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8c8.1 6.77 17.39 6.35 20.05 6.35C51.46 52.84 47 45.21 32 56c-15-10.79-19.45-3.16-20-41.65 2.59 0 11.88.42 20-6.35z" />
    </svg>);
}


export function QuestionMarkSolid({ size = 18, fill = "none", stroke = "black" }) {
    return (
        <svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g data-name="Layer 2">
                <g data-name="menu-arrow-circle">
                    <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0" />
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-5.16V14a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5 1 1 0 0 1-2 0 3.5 3.5 0 1 1 4.5 3.34z" />
                </g>
            </g>
        </svg>);
}

export function QuestionMarkOutline({ size = 18, fill = "none", stroke = "black" }) {
    return (
        <svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g data-name="Layer 2">
                <g data-name="menu-arrow-circle">
                    <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0" />
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                    <path d="M12 6a3.5 3.5 0 0 0-3.5 3.5 1 1 0 0 0 2 0A1.5 1.5 0 1 1 12 11a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-1.16A3.49 3.49 0 0 0 12 6z" />
                    <circle cx="12" cy="17" r="1" />
                </g>
            </g>
        </svg>);
}


export function FlagMarkSolid({ size = 18, fill = "none", stroke = "black" }) {
    return (<svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.42 4.44994C19.3203 4.38116 19.2053 4.3379 19.085 4.32395C18.9647 4.31 18.8428 4.32579 18.73 4.36994C17.5425 4.8846 16.2857 5.22155 15 5.36994C14.1879 5.15273 13.4127 4.81569 12.7 4.36994C11.7802 3.80143 10.763 3.40813 9.7 3.20994C8.41 3.08994 5.34 4.09994 4.7 4.30994C4.55144 4.36012 4.42234 4.4556 4.33086 4.58295C4.23938 4.71031 4.19012 4.86314 4.19 5.01994V19.9999C4.19 20.1989 4.26902 20.3896 4.40967 20.5303C4.55032 20.6709 4.74109 20.7499 4.94 20.7499C5.13891 20.7499 5.32968 20.6709 5.47033 20.5303C5.61098 20.3896 5.69 20.1989 5.69 19.9999V14.1399C6.93659 13.6982 8.23315 13.4127 9.55 13.2899C10.3967 13.4978 11.2062 13.8351 11.95 14.2899C12.8201 14.8218 13.7734 15.2038 14.77 15.4199H15C16.4474 15.2326 17.8633 14.8526 19.21 14.2899C19.3506 14.2342 19.4713 14.1379 19.5568 14.0132C19.6423 13.8885 19.6887 13.7411 19.69 13.5899V5.06994C19.6975 4.95258 19.6769 4.83512 19.63 4.7273C19.583 4.61947 19.511 4.5244 19.42 4.44994Z"
        />
    </svg>);
}

export function FlagMarkOutline({ size = 18, fill = "none", stroke = "black" }) {
    return (<svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.42 4.44996C19.3203 4.38118 19.2053 4.33792 19.085 4.32397C18.9647 4.31002 18.8428 4.32581 18.73 4.36996C17.5396 4.87622 16.284 5.21284 15 5.36996C14.1879 5.15275 13.4127 4.81571 12.7 4.36996C11.7794 3.80309 10.7625 3.40992 9.7 3.20996C7.99309 3.36092 6.31266 3.73061 4.7 4.30996C4.55144 4.36014 4.42234 4.45562 4.33086 4.58297C4.23938 4.71033 4.19012 4.86315 4.19 5.01996V20C4.19 20.1989 4.26902 20.3896 4.40967 20.5303C4.55032 20.6709 4.74109 20.75 4.94 20.75C5.13891 20.75 5.32968 20.6709 5.47033 20.5303C5.61098 20.3896 5.69 20.1989 5.69 20V14.15C6.9351 13.6993 8.23195 13.407 9.55 13.28C10.3964 13.4888 11.2057 13.8261 11.95 14.28C12.8201 14.8118 13.7734 15.1938 14.77 15.41H15C16.4483 15.2271 17.8648 14.8469 19.21 14.28C19.3513 14.2254 19.4729 14.1293 19.5585 14.0044C19.6442 13.8794 19.6901 13.7315 19.69 13.58V5.06996C19.6975 4.9526 19.6769 4.83514 19.63 4.72732C19.583 4.61949 19.511 4.52441 19.42 4.44996ZM18.25 13.08C17.2111 13.5101 16.1172 13.7928 15 13.92C14.1879 13.7028 13.4127 13.3657 12.7 12.92C11.7794 12.3531 10.7625 11.9599 9.7 11.76H9.5C8.21276 11.8759 6.94385 12.1445 5.72 12.56V5.55996C6.9651 5.10926 8.26195 4.81696 9.58 4.68996C10.4264 4.89885 11.2357 5.23609 11.98 5.68996C12.8501 6.22181 13.8034 6.60379 14.8 6.81996C15.9734 6.77394 17.1301 6.52702 18.22 6.08996L18.25 13.08Z" />
    </svg>);
}

export function CheckCorrect({ size = 18, fill = "none", stroke = "black" }) {
    return (<svg height={size} width={size} fill={fill} stroke={stroke} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0)">
            <path d="M42 20V39C42 40.6569 40.6569 42 39 42H9C7.34315 42 6 40.6569 6 39V9C6 7.34315 7.34315 6 9 6H30" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 20L26 28L41 7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        </g>
        <defs>
            <clipPath id="clip0">
                <rect width="48" height="48" fill="white" />
            </clipPath>
        </defs>
    </svg>);
}

