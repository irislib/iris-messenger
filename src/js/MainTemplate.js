export default `
  <section id="login" class="hidden">
    <div id="login-content">
      <form id="login-form" autocomplete="off">
        <div id="create-account">
          <img style="width: 86px" src="img/android-chrome-192x192.png" alt="Iris">
          <h1>Iris</h1>
          <input autofocus autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off" id="login-form-name" type="text" name="name" placeholder="<%= whats_your_name %>">
          <p><button id="sign-up" type="submit"><%= new_user_go %></button></p>
          <br>
          <p><a href="#" id="show-existing-account-login"><%= already_have_an_account %></a></p>
          <p>
            <svg width="14" height="14" style="margin-bottom: -1px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 469.333 469.333" style="enable-background:new 0 0 469.333 469.333;" xml:space="preserve"><path fill="currentColor" d="M253.227,300.267L253.227,300.267L199.04,246.72l0.64-0.64c37.12-41.387,63.573-88.96,79.147-139.307h62.507V64H192 V21.333h-42.667V64H0v42.453h238.293c-14.4,41.173-36.907,80.213-67.627,114.347c-19.84-22.08-36.267-46.08-49.28-71.467H78.72 c15.573,34.773,36.907,67.627,63.573,97.28l-108.48,107.2L64,384l106.667-106.667l66.347,66.347L253.227,300.267z"/><path fill="currentColor" d="M373.333,192h-42.667l-96,256h42.667l24-64h101.333l24,64h42.667L373.333,192z M317.333,341.333L352,248.853 l34.667,92.48H317.333z"/></svg>
            <select class="language-selector"></select>
          </p>
        </div>
      </form>
      <div id="existing-account-login" class="hidden">
        <p><a href="#" id="show-create-account">&lt; <%= back %></a></p>
        <input id="paste-privkey" placeholder="<%= paste_private_key %>">
        <p>
          <button id="scan-privkey-btn"><%= scan_private_key_qr_code %></button>
        </p>
        </p>
          <video id="privkey-qr-video" width="320" height="320" style="object-fit: cover;" class="hidden"></video>
        </p>
      </div>
    </div>
  </section>

  <section class="sidebar hidden-xs">
    <div class="user-info">
      <div id="my-identicon"></div>
      <div class="user-name"></div>
    </div>
    <div id="enable-notifications-prompt">
      <div class="title"><%= get_notified_new_messages %></div>
      <div><a><%= turn_on_desktop_notifications %></a></div>
    </div>
    <div class="chat-list">
      <div class="chat-item public-messages" data-pub="public">
        <svg
         viewBox="0 -256 1792 1792"
         width="18"
         height="18" style="margin-right: 10px">
        <g
           transform="matrix(1,0,0,-1,136.67797,1300.6102)"
           id="g3027">
          <path
             d="m 1193,993 q 11,7 25,22 v -1 q 0,-2 -9.5,-10 -9.5,-8 -11.5,-12 -1,1 -4,1 z m -6,-1 q -1,1 -2.5,3 -1.5,2 -1.5,3 3,-2 10,-5 -6,-4 -6,-1 z m -459,183 q -16,2 -26,5 1,0 6.5,-1 5.5,-1 10.5,-2 5,-1 9,-2 z m 45,37 q 7,4 13.5,2.5 6.5,-1.5 7.5,-7.5 -5,3 -21,5 z m -8,-6 -3,2 q -2,3 -5.5,5 -3.5,2 -4.5,2 2,-1 21,-3 -6,-4 -8,-6 z m -102,84 v 2 q 1,-2 3,-5.5 2,-3.5 3,-5.5 z m -105,-40 q 0,-2 -1,-2 l -1,2 h 2 z M 933,206 v -1 1 z M 768,1408 q 209,0 385.5,-103 Q 1330,1202 1433,1025.5 1536,849 1536,640 1536,431 1433,254.5 1330,78 1153.5,-25 977,-128 768,-128 559,-128 382.5,-25 206,78 103,254.5 0,431 0,640 0,849 103,1025.5 206,1202 382.5,1305 559,1408 768,1408 z m 472,-1246 5,5 q -7,10 -29,12 1,12 -14,26.5 -15,14.5 -27,15.5 0,4 -10.5,11 -10.5,7 -17.5,8 -9,2 -27,-9 -7,-3 -4,-5 -3,3 -12,11 -9,8 -16,11 -2,1 -7.5,1 -5.5,0 -8.5,2 -1,1 -6,4.5 -5,3.5 -7,4.5 -2,1 -6.5,3 -4.5,2 -7.5,1.5 -3,-0.5 -7.5,-2.5 -4.5,-2 -8.5,-6 -4,-4 -4.5,-15.5 -0.5,-11.5 -2.5,-14.5 -8,6 -0.5,20 7.5,14 1.5,20 -7,7 -21,0.5 -14,-6.5 -21,-15.5 -1,-1 -9.5,-5.5 Q 963,241 960,238 q -4,-6 -9,-17.5 -5,-11.5 -6,-13.5 0,2 -2.5,6.5 -2.5,4.5 -2.5,6.5 -12,-2 -16,3 5,-16 8,-17 l -4,2 q -1,-6 3,-15 4,-9 4,-11 1,-5 -1.5,-13 -2.5,-8 -2.5,-11 0,-2 5,-11 4,-19 -2,-32 0,-1 -3.5,-7 -3.5,-6 -6.5,-11 l -2,-5 -2,1 q -1,1 -2,0 -1,-6 -9,-13 -8,-7 -10,-11 -15,-23 -9,-38 3,-8 10,-10 3,-1 3,2 1,-9 -11,-27 1,-1 4,-3 -17,0 -10,-14 202,36 352,181 h -3 z M 680,347 q 16,3 30.5,-16 14.5,-19 22.5,-23 41,-20 59,-11 0,-9 14,-28 3,-4 6.5,-11.5 3.5,-7.5 5.5,-10.5 5,-7 19,-16 14,-9 19,-16 6,3 9,9 13,-35 24,-34 5,0 8,8 0,-1 -0.5,-3 -0.5,-2 -1.5,-3 7,15 5,26 l 6,4 q 5,4 5,5 -6,6 -9,-3 -30,-14 -48,22 -2,3 -4.5,8 -2.5,5 -5,12 -2.5,7 -1.5,11.5 1,4.5 6,4.5 11,0 12.5,1.5 1.5,1.5 -2.5,6 -4,4.5 -4,7.5 -1,4 -1.5,12.5 Q 853,318 852,322 l -5,6 q -5,6 -11.5,13.5 -6.5,7.5 -7.5,9.5 -4,-10 -16.5,-8.5 -12.5,1.5 -18.5,9.5 1,-2 -0.5,-6.5 -1.5,-4.5 -1.5,-6.5 -14,0 -17,1 1,6 3,21 2,15 4,22 1,5 5.5,13.5 4.5,8.5 8,15.5 3.5,7 4.5,14 1,7 -4.5,10.5 -5.5,3.5 -18.5,2.5 -20,-1 -29,-22 -1,-3 -3,-11.5 -2,-8.5 -5,-12.5 -3,-4 -9,-7 -8,-3 -27,-2 -19,1 -26,5 -14,8 -24,30.5 -10,22.5 -11,41.5 0,10 3,27.5 3,17.5 3,27 0,9.5 -6,26.5 3,2 10,10.5 7,8.5 11,11.5 2,2 5,2 h 5 q 0,0 4,2 4,2 3,6 -1,1 -4,3 -3,3 -4,3 4,-3 19,-1 15,2 19,2 0,1 22,0 17,-13 24,2 0,1 -2.5,10.5 -2.5,9.5 -0.5,14.5 5,-29 32,-10 3,-4 16.5,-6 13.5,-2 18.5,-5 3,-2 7,-5.5 4,-3.5 6,-5 2,-1.5 6,-0.5 4,1 9,7 11,-17 13,-25 11,-43 20,-48 8,-2 12.5,-2 4.5,0 5,10.5 0.5,10.5 0,15.5 -0.5,5 -1.5,13 l -2,37 q -16,3 -20,12.5 -4,9.5 1.5,20 5.5,10.5 16.5,19.5 1,1 16.5,8 15.5,7 21.5,12 24,19 17,39 9,-2 11,9 l -5,3 q -4,3 -8,5.5 -4,2.5 -5,1.5 11,7 2,18 5,3 8,11.5 3,8.5 9,11.5 9,-14 22,-3 8,9 2,18 5,8 22,11.5 17,3.5 20,9.5 5,-1 7,0 2,1 2,4.5 v 7.5 q 0,0 1,8.5 1,8.5 3,7.5 4,6 16,10.5 12,4.5 14,5.5 l 19,12 q 4,4 0,4 18,-2 32,11 13,12 -5,23 2,7 -4,10.5 -6,3.5 -16,5.5 3,1 12,0.5 9,-0.5 12,1.5 15,11 -7,17 -20,5 -47,-13 -3,-2 -13,-12 -10,-10 -17,-11 15,18 5,22 8,-1 22.5,9 14.5,10 15.5,11 4,2 10.5,2.5 6.5,0.5 8.5,1.5 71,25 92,-1 8,11 11,15 3,4 9.5,9 6.5,5 15.5,8 21,7 23,9 l 1,23 q -12,-1 -18,8 -6,9 -7,22 l -6,-8 q 0,6 -3.5,7.5 -3.5,1.5 -7.5,0.5 -4,-1 -9.5,-2 -5.5,-1 -7.5,0 -9,2 -19.5,15.5 -10.5,13.5 -14.5,16.5 9,0 9,5 -2,5 -10,8 1,6 -2,8 -3,2 -9,0 -2,12 -1,13 -6,1 -11,11 -5,10 -8,10 -2,0 -4.5,-2 -2.5,-2 -5,-5.5 l -5,-7 q 0,0 -3.5,-5.5 l -2,-2 q -12,6 -24,-10 -9,1 -17,-2 15,6 2,13 -11,5 -21,2 12,5 10,14 -2,9 -12,16 1,0 4,-1 3,-1 4,-1 -1,5 -9.5,9.5 -8.5,4.5 -19.5,9 -11,4.5 -14,6.5 -7,5 -36,10.5 -29,5.5 -36,1.5 -5,-3 -6,-6 -1,-3 1.5,-8.5 2.5,-5.5 3.5,-8.5 6,-23 5,-27 -1,-3 -8.5,-8 -7.5,-5 -5.5,-12 1,-4 11.5,-10 10.5,-6 12.5,-12 5,-13 -4,-25 -4,-5 -15,-11 -11,-6 -14,-10 -5,-5 -3.5,-11.5 1.5,-6.5 0.5,-9.5 1,1 1,2.5 0,1.5 1,2.5 0,-13 11,-22 8,-6 -16,-18 -20,-11 -20,-4 1,8 -7.5,16 -8.5,8 -10.5,12 -2,4 -3.5,19 -1.5,15 -9.5,21 -6,4 -19,4 -13,0 -18,-5 0,10 -49,30 -17,8 -58,4 7,1 0,17 -8,16 -21,12 -8,25 -4,35 2,5 9,14 7,9 9,15 1,3 15.5,6 14.5,3 16.5,8 1,4 -2.5,6.5 -3.5,2.5 -9.5,4.5 53,-6 63,18 5,9 3,14 0,-1 2,-1 2,0 2,-1 12,3 7,17 19,8 26,8 5,-1 11,-6 6,-5 10,-5 17,-3 21.5,10 4.5,13 -9.5,23 7,-4 7,6 -1,13 -7,19 -3,2 -6.5,2.5 -3.5,0.5 -6.5,0 -3,-0.5 -7,0.5 -1,0 -8,2 -1,-1 -2,-1 h -8 q -4,-2 -4,-5 v -1 q -1,-3 4,-6 l 5,-1 3,-2 q -1,0 -2.5,-2.5 -1.5,-2.5 -2.5,-2.5 0,-3 3,-5 -2,-1 -14,-7.5 -12,-6.5 -17,-10.5 -1,-1 -4,-2.5 -3,-1.5 -4,-2.5 -2,-1 -4,2 -2,3 -4,9 -2,6 -4,11.5 -2,5.5 -4.5,10 -2.5,4.5 -5.5,4.5 -12,0 -18,-17 3,10 -13,17.5 -16,7.5 -25,7.5 20,15 -9,30 l -1,1 q -30,-4 -45,-7 -2,-6 3,-12 -1,-7 6,-9 0,-1 0.5,-1 0.5,0 0.5,-1 0,1 -0.5,1 -0.5,0 -0.5,1 3,-1 10.5,-1.5 7.5,-0.5 9.5,-1.5 3,-1 4.5,-2 l 7.5,-5 q 0,0 5.5,-6 5.5,-6 -2.5,-5 -2,-1 -9,-4 -7,-3 -12.5,-5.5 -5.5,-2.5 -6.5,-3.5 -3,-5 0,-16 3,-11 -2,-15 -5,5 -10,18.5 -5,13.5 -8,17.5 8,-9 -30,-6 l -8,1 q -4,0 -15,-2 -11,-2 -16,-1 -7,0 -29,6 7,17 5,25 5,0 7,2 l -6,3 q -3,-1 -25,-9 2,-3 8,-9.5 6,-6.5 9,-11.5 -22,6 -27,-2 0,-1 -9,0 -25,1 -24,-7 1,-4 9,-12 0,-9 -1,-9 -27,22 -30,23 -172,-83 -276,-248 1,-2 2.5,-11 1.5,-9 3.5,-8.5 2,0.5 11,4.5 9,-9 3,-21 2,2 36,-21 56,-40 22,-53 v 5.5 q 0,0 1,6.5 -9,-1 -19,5 -3,-6 0.5,-20 3.5,-14 11.5,-14 -8,0 -10.5,-17 Q 257,834 257,812.5 257,791 256,787 l 2,-1 q -3,-13 6,-37.5 9,-24.5 24,-20.5 -4,-18 5,-21 -1,-4 0,-8 1,-4 4.5,-8.5 3.5,-4.5 6,-7 l 7.5,-7.5 6,-6 q 28,-11 41,-29 4,-6 10.5,-24.5 Q 375,598 384,591 q -2,-6 10,-21.5 12,-15.5 11,-25.5 -1,0 -2.5,-0.5 -1.5,-0.5 -2.5,-0.5 3,-8 16.5,-16 13.5,-8 16.5,-14 2,-3 2.5,-10.5 0.5,-7.5 3,-12 2.5,-4.5 8.5,-2.5 3,24 -26,68 -16,27 -18,31 -3,5 -5.5,16.5 -2.5,11.5 -4.5,15.5 27,-9 26,-13 -5,-10 26,-52 2,-3 10,-10 8,-7 11,-12 3,-4 9.5,-14.5 Q 482,507 486,502 q -1,0 -3,-2 l -3,-3 q 4,-2 9,-5 5,-3 8,-4.5 3,-1.5 7.5,-5 4.5,-3.5 7.5,-7.5 16,-18 20,-33 1,-4 0.5,-15.5 Q 532,415 534,410 q 2,-6 6,-11 4,-5 11.5,-10 7.5,-5 11.5,-7 4,-2 14.5,-6.5 10.5,-4.5 11.5,-5.5 2,-1 18,-11 16,-10 25,-14 10,-4 16.5,-4.5 6.5,-0.5 16,2.5 9.5,3 15.5,4 z"
             id="path3029"
             inkscape:connector-curvature="0"
             style="fill:currentColor" />
        </g>
        </svg>
        <%= public_messages %>
      </div>
      <div class="chat-item new">
        <svg class="svg-inline--fa fa-smile fa-w-16" style="margin-right:10px;margin-top:3px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 510 510" xml:space="preserve">
          <path fill="currentColor" d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"/>
        </svg>
        <%= new_chat %>
      </div>
      <div id="welcome" class="visible-xs-block">
        <h3>Iris</h3>
        <img src="img/icon128.png" width="64" height="64" alt="iris it is">
      </div>
    </div>
  </section>

  <section class="main">
    <header>
      <div id="back-button" class="visible-xs-inline-block">
        ‹
        <span class="unseen unseen-total"></span>
      </div>
      <div id="header-content"></div>
    </header>

    <!-- Chat view -->
    <div class="main-view" id="message-view">
      <div id="message-list"></div>
      <div id="attachment-preview" class="hidden"></div>
    </div>
    <div id="not-seen-by-them" style="display: none">
      <p><%= if_other_person_doesnt_see_message %></p>
      <p><button class="copy-chat-link"><%= copy_your_chat_link %></button></p>
    </div>
    <div class="message-form" style="display:none">
      <form autocomplete="off">
        <input name="attachment-input" type="file" class="hidden" id="attachment-input" accept="image/*" multiple>
        <button type="button" id="attach-file">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"/></svg>
        </button>
        <button type="button" id="emoji-picker">
          <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="smile" class="svg-inline--fa fa-smile fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"></path></svg>
        </button>
        <input id="new-msg" type="text" placeholder="<%= type_a_message %>" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off">
        <button type="submit">
          <svg class="svg-inline--fa fa-w-16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;" xml:space="preserve" width="100px" height="100px" fill="#000000" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>
        </button>
      </form>
    </div>

    <!-- New chat view -->
    <div class="main-view" id="new-chat">
      <h3><%= have_someones_chat_link %></h3>
      <input id="paste-chat-link" type="text" placeholder="<%= paste_their_chat_link %>">
      <button id="scan-chatlink-qr-btn"><%= or_scan_qr_code %></button>
      <video id="chatlink-qr-video" width="320" height="320" style="object-fit: cover;"></video>
      <h3><%= give_your_chat_link %></h3>
      <button class="copy-chat-link"><%= copy_your_chat_link %></button>
      <button id="show-my-qr-btn"><%= or_show_qr_code %></button>
      <p id="my-qr-code" class="qr-container" style="display:none"></p>
      <p><small><%= beware_of_sharing_chat_link_publicly %></small></p>
      <h3><%= new_group %></h3>
      <p>
        <input id="new-group-name" type="text" placeholder="<%= group_name %>">
        <button id="new-group-create"><%= create %></button>
      </p>
      <hr/>
      <h3><%= your_chat_links %></h3>
      <p><button id="generate-chat-link"><%= create_new_chat_link %></button></p>
      <div id="my-chat-links" class="flex-table"></div>
    </div>

    <!-- Settings view -->
    <div class="main-view" id="settings">
      <h3><%= profile %></h3>
      <p>
        <%= your_name %>:
      </p>
      <p>
        <input id="settings-name" placeholder="<%= your_name %>">
      </p>
      <p id="profile-photo-chapter">
        <%= profile_photo %>:
      </p>
      <div id="profile-photo-settings">
        <img id="current-profile-photo">
        <button id="add-profile-photo"><%= add_profile_photo %></button>
        <div id="profile-photo-preview-container">
          <img id="profile-photo-preview" class="hidden">
        </div>
        <p>
          <input name="profile-photo-input" type="file" class="hidden" id="profile-photo-input" accept="image/*">
        </p>
        <p id="profile-photo-error" class="hidden"><%= profile_photo_too_big %></p>
        <p>
          <button id="cancel-profile-photo" class="hidden"><%= cancel %></button>
          <button id="use-profile-photo" class="hidden"><%= use_photo %></button>
          <button id="remove-profile-photo" class="hidden"><%= remove_photo %></button>
        </p>
      </div>
      <p><%= about_text %>:</p>
      <p>
        <input id="settings-about" style="width:100%" placeholder="<%= about_text %>">
      </p>
      <hr/>
      <h3><%= account %></h3>
      <p>
        <b><%= save_backup_of_privkey_first %></b> <%= otherwise_cant_log_in_again %>
      </p>
      <p>
        <button class="show-logout-confirmation"><%= log_out %></button>
      </p>
      <h4><%= private_key %></h4>
      <p>
        <%= private_key_warning %>
      </p>
      <p>
        <button id="download-private-key"><%= download_private_key %></button>
        <button id="copy-private-key"><%= copy_private_key %></button>
      </p>
      <p>
        <button id="show-private-key-qr"><%= show_privkey_qr %></button>
      </p>
      <p><small><%= privkey_storage_recommendation %></small></p>
      <hr/>
      <h3><%= language %></h3>
      <p><select class="language-selector"></select></p>
      <hr/>
      <h3><%= peers %></h3>
      <div id="peers" class="flex-table">
        <div class="flex-row" id="add-peer-row">
          <div class="flex-cell">
            <input type="url" id="add-peer-url" placeholder="<%= peer_url %>">
            <input type="checkbox" id="add-peer-public">
            <label for="add-peer-public"><%= public %></label>
            <button id="add-peer-btn"><%= add %></button>
          </div>
        </div>
        <p>
          <small>
            <%= public_peer_info %>
          </small>
        </p>
        <p>
          <small>
            <%= peers_info %>
          </small>
        </p>
      </div>
      <hr/>
      <h3><%= webrtc_connection_options %></h3>
      <p><small><%= webrtc_info %></small></p>
      <p><textarea rows="4" id="rtc-config" placeholder="<%= webrtc_connection_options %>"></textarea></p>
      <button id="restore-default-rtc-config"><%= restore_defaults %></button>
      <hr/>
      <h3><%= about %></h3>
      <p>Iris is like the messaging apps we're used to, but better.</p>
      <ul>
        <li><b>No phone number or signup required.</b> Just start using it!</li>
        <li><b>Secure</b>: It's open source. Users can validate that big brother doesn't read your messages.</li>
        <li><b>Available</b>: It works offline-first and is not dependent on any single centrally managed server. Users can even connect directly to each other.</li>
      </ul>
      <p>Released under MIT license. Code: <a href="https://github.com/irislib/iris-messenger">Github</a>.</p>
      <p><small>Version 1.3.2</small></p>

      <div id="desktop-application-about">
        <h4>Get the desktop application</h4>
        <ul>
          <li>Communicate and synchronize with local network peers without Internet access
            <ul>
              <li>When local peers eventually connect to the Internet, your messages are relayed globally</li>
              <li>Bluetooth support upcoming</li>
            </ul>
          </li>
          <li>Opens to background on login: stay online and get message notifications</li>
          <li>More secure and available: no need to open the browser application from a server</li>
        </ul>
        <p><a href="https://github.com/irislib/iris-electron/releases">Download</a></p>
      </div>

      <h4>Privacy</h4>
      <p>Messages are end-to-end encrypted, but message timestamps and the number of chats aren't. In a decentralized network this information is potentially available to anyone.</p>
      <p>By looking at timestamps in chats, it is possible to guess who are chatting with each other. There are potential technical solutions to hiding the timestamps, but they are not implemented yet. It is also possible, if not trivial, to find out who are communicating with each other by monitoring data subscriptions on the decentralized database.</p>
      <p>In that regard, Iris prioritizes decentralization and availability over perfect privacy.</p>
      <p>Profile names, photos and online status are currently public. That can be changed when advanced group permissions are developed.</p>
      <p><%= application_security_warning %></p>

      <h4>Donate</h4>
      <p><%= donate_info %>: 3GopC1ijpZktaGLXHb7atugPj9zPGyQeST</p>
    </div>

    <!-- Logout confirmation -->
    <div class="main-view" id="logout-confirmation">
      <p>
        <%= logout_confirmation_info %>
      </p>
      <p>
        <button class="open-settings-button"><%= back %></button>
      </p>
      <p>
        <button class="logout-button"><%= log_out %></button>
      </p>
    </div>


    <!-- Profile view -->
    <div class="main-view" id="profile">
      <div class="profile-photo-container"><img class="profile-photo"></div>
      <div class="content">
        <div id="profile-group-settings">
          <div id="profile-group-name-container"><%= group_name %>: <input id="profile-group-name" placeholder="<%= group_name %>"></div>
          <p><%= participants %>:</p>
          <div id="profile-group-participants"></div>
          <div id="profile-add-participant" style="display:none;">
            <p><%= add_participant %>:</p>
            <p><input id="profile-add-participant-input" type="text" style="width: 220px" placeholder="<%= new_participants_chat_link %>"></p>
            <p><small>Currently you need to add each member here. After that, they can join using the group link ("copy link" below). "Join links" upcoming!</small></p>
          </div>
          <hr>
        </div>
        <div class="profile-about" style="display:none">
          <p class="profile-about-content"></p>
        </div>
        <p class="status"></p>
        <p class="last-active"></p>
        <!--
        <p>
          <button class="add-friend"><%= add_friend %></button>
        </p>
        <p>
          <small>Friends can optionally direct connect to each other and store each others' encrypted data.</small>
        </p>
      -->
        <p>
          <button class="send-message"><%= send_message %></button>
          <button class="copy-user-link"><%= copy_link %></button>
        </p>
        <p id="profile-page-qr" class="qr-container"></p>
        <hr/>
        <h3><%= chat_settings %></h3>
        <div class="profile-nicknames">
          <h4><%= nicknames %></h4>
          <p>
            <%= nickname %>: <input id="profile-nickname-their">
          </p>
          <p id="profile-nickname-my-container">
            <%= their_nickname_for_you %>: <span id="profile-nickname-my"></span>
          </p>
        </div>
        <div class="notification-settings">
          <h4><%= notifications %></h4>
          <input type="radio" id="notifyAll" name="notificationPreference" value="all">
          <label for="notifyAll"><%= all_messages %></label><br>
          <input type="radio" id="notifyMentionsOnly" name="notificationPreference" value="mentions">
          <label for="notifyMentionsOnly"><%= mentions_only %></label><br>
          <input type="radio" id="notifyNothing" name="notificationPreference" value="nothing">
          <label for="notifyNothing"><%= nothing %></label><br>
        </div>
        <hr/>
        <p>
          <button class="delete-chat"><%= delete_chat %></button>
          <!-- <button class="block-user"><%= block_user %></button> -->
        </p>
        <div id="profile-public-messages">
          <hr/>
          <h3><%= public_messages %></h3>
          <div id="profile-public-message-list" class="public-messages-view"></div>
        </div>
      </div>
    </div>

  </section>
`;
