export function generateEmailTemplate(type, data) {
  const header = getHeader(type);
  const content = getContent(type, data);

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <title></title>
  
    <style type="text/css">
      @media only screen and (min-width: 620px) {
  .u-row {
    width: 600px !important;
  }
  .u-row .u-col {
    vertical-align: top;
  }

  .u-row .u-col-50 {
    width: 300px !important;
  }

  .u-row .u-col-100 {
    width: 600px !important;
  }

}

@media (max-width: 620px) {
  .u-row-container {
    max-width: 100% !important;
    padding-left: 0px !important;
    padding-right: 0px !important;
  }
  .u-row .u-col {
    min-width: 320px !important;
    max-width: 100% !important;
    display: block !important;
  }
  .u-row {
    width: 100% !important;
  }
  .u-col {
    width: 100% !important;
  }
  .u-col > div {
    margin: 0 auto;
  }
}
body {
  margin: 0;
  padding: 0;
}

table,
tr,
td {
  vertical-align: top;
  border-collapse: collapse;
}

p {
  margin: 0;
}

.ie-container table,
.mso-container table {
  table-layout: fixed;
}

* {
  line-height: inherit;
}

a[x-apple-data-detectors='true'] {
  color: inherit !important;
  text-decoration: none !important;
}

table, td { color: #000000; } #u_body a { color: #161a39; text-decoration: underline; }
    </style>
  
  

<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css"><link href="https://fonts.googleapis.com/css?family=Lato:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->

</head>

<body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
  <!--[if IE]><div class="ie-container"><![endif]-->
  <!--[if mso]><div class="mso-container"><![endif]-->
  <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
    

<div class="u-row-container" style="padding: 0px;background-color: #f9f9f9">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #f9f9f9;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #f9f9f9;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #f9f9f9;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Lato',sans-serif;" align="left">
        
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #f9f9f9;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
    <tbody>
      <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
          <span>&#160;</span>
        </td>
      </tr>
    </tbody>
  </table>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
</div>



<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Lato',sans-serif;" align="left">
        
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding-right: 0px;padding-left: 0px;" align="center">
      
      <img align="center" border="0" src="cid:logo" alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 31%;max-width: 179.8px;" width="179.8"/>
      
    </td>
  </tr>
</table>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
</div>



<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #161a39;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #161a39;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #009b9a;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="background-color: #009b9a;height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:30px 10px;font-family:'Lato',sans-serif;" align="left">
        
  <div style="font-size: 14px; line-height: 140%; text-align: center; word-wrap: break-word;">
    ${header}
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
</div>



<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 40px 30px;font-family:'Lato',sans-serif;" align="left">
        
  <div style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
    ${content}
  </div>

      </td>
    </tr>
  </tbody>
</table>

<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 40px;font-family:'Lato',sans-serif;" align="left">
        
  <!--[if mso]><style>.v-button {background: transparent !important;}</style><![endif]-->

      </td>
    </tr>
  </tbody>
</table>

<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 40px 30px;font-family:'Lato',sans-serif;" align="left">
        
  <div style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
    <p style="font-size: 14px; line-height: 140%;"><span style="color: #888888; font-size: 14px; line-height: 19.6px;"><em><span style="font-size: 16px; line-height: 22.4px;">This Email was sent automatically. Do not reply to this email. Contact Admin for more info.</span></em></span><br /><span style="color: #888888; font-size: 14px; line-height: 19.6px;"><em><span style="font-size: 16px; line-height: 22.4px;"> </span></em></span></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #18163a;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #18163a;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="300" style="background-color: #009b9a;width: 300px;padding: 20px 20px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
  <div style="background-color: #009b9a;height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 20px 20px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Lato',sans-serif;" align="left">
        
  <div style="font-size: 14px; color: #ffffff; line-height: 140%; text-align: left; word-wrap: break-word;">
    <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px; color: #ecf0f1;">Marquardt Automotive Tunisie SARL </span></p>
<p style="font-size: 14px; line-height: 140%;">Lot no 23, 24, Zone Industrielle d'El Agba, 2087, El Hrairia, Tunis, Tunisie</p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="300" style="background-color: #009b9a;width: 300px;padding: 0px 0px 0px 20px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
  <div style="background-color: #009b9a;height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px 0px 0px 20px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:33px;font-family:'Lato',sans-serif;" align="left">
        
  <div style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
    <p style="line-height: 140%; font-size: 14px;"><span style="font-size: 14px; line-height: 19.6px;"><span style="color: #ecf0f1; font-size: 14px; line-height: 19.6px;"><span style="line-height: 19.6px; font-size: 14px;"><span style="line-height: 19.6px; color: #ffffff;"><a href="https://tn.marquardt.com" style="color: #ffffff;">https://tn.marquardt.com</a></span><br />Marquardt ©  All Rights Reserved</span></span></span></p>
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px;background-color: #f9f9f9">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #1c103b;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #f9f9f9;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #1c103b;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #009b9a;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="background-color: #009b9a;height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Lato',sans-serif;" align="left">
        
  <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 4px solid #028281;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
    <tbody>
      <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
          <span>&#160;</span>
        </td>
      </tr>
    </tbody>
  </table>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


  
  
<div class="u-row-container" style="padding: 0px;background-color: transparent">
  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #f9f9f9;">
    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #f9f9f9;"><![endif]-->
      
<!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
<div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
  <div style="height: 100%;width: 100% !important;">
  <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
  
<table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
  <tbody>
    <tr>
      <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 40px 30px 20px;font-family:'Lato',sans-serif;" align="left">
        
  <div style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
    
  </div>

      </td>
    </tr>
  </tbody>
</table>

  <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
  </div>
</div>
<!--[if (mso)|(IE)]></td><![endif]-->
      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
    </div>
  </div>
  </div>
  


    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
    </td>
  </tr>
  </tbody>
  </table>
  <!--[if mso]></div><![endif]-->
  <!--[if IE]></div><![endif]-->
</body>

</html>
  `;
}

function getHeader(type) {
  const headers = {
    ticket: `<p style="font-size: 14px; line-height: 140%; text-align: center;"><strong><span style="font-size: 28px; line-height: 39.2px; color: #ffffff; font-family: Montserrat, sans-serif;">You have been assigned a maintenance ticket</span></strong></p>`,
    machine: `<p style="font-size: 14px; line-height: 140%; text-align: center;"><strong><span style="font-size: 28px; line-height: 39.2px; color: #ffffff; font-family: Montserrat, sans-serif;">A machine has been assigned to you</span></strong></p>`,
    checklist: `<p style="font-size: 14px; line-height: 140%; text-align: center;"><strong><span style="font-size: 28px; line-height: 39.2px; color: #ffffff; font-family: Montserrat, sans-serif;">Upcoming checklist notification</span></strong></p>`,
    password: `<p style="font-size: 14px; line-height: 140%; text-align: center;"><strong><span style="font-size: 28px; line-height: 39.2px; color: #ffffff; font-family: Montserrat, sans-serif;">You Requested a Password Reset</span></strong></p>`
  };
  
  return headers[type] || `<p style="font-size: 14px; line-height: 140%; text-align: center;"><strong><span style="font-size: 28px; line-height: 39.2px; color: #ffffff; font-family: Montserrat, sans-serif;">Notification</span></strong></p>`;
}

function getContent(type, data) {
  switch (type) {
    case 'ticket':
      return `
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">A new maintenance ticket has been assigned to you:</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Title:</strong> ${data.title}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Description:</strong> ${data.description}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Scheduled Date:</strong> ${data.scheduledDate}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Machine:</strong> ${data.machineName}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Category:</strong> ${data.category}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Criticality:</strong> ${data.critical}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">Please review the ticket details above and take the necessary actions.</p>
      `;
    case 'report': 
    return `
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">Maintenance Report:</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Title:</strong> ${data.title}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Description:</strong> ${data.description}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Scheduled Date:</strong> ${data.scheduledDate}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Machine:</strong> ${data.machineName}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Category:</strong> ${data.category}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Criticality:</strong> ${data.critical}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Title:</strong> ${data.problem}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Description:</strong> ${data.solution}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Scheduled Date:</strong> ${data.notes}</p>
    `;
    case 'machine':
      return `
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">A new machine has been assigned to you:</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Machine Name:</strong> ${data.machineName}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Location:</strong> ${data.location}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">SAP Number:</strong> ${data.sapNumber}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Assignment Date:</strong> ${data.assignmentDate}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">Please familiarize yourself with the machine details and its location.</p>
      `;
    case 'checklist':
      return `
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">You have an upcoming checklist to complete:</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Checklist Name:</strong> ${data.checklistName}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Checklist Name:</strong> ${data.machineName}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Last Completion Date:</strong> ${data.lastCompletionDate}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Scheduled Date:</strong> ${data.nextPlanned}</p>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;"><strong style="color: #009a9b;">Checklist Items:</strong></p>
        <ul style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">
          ${data.items.map(item => `
            <li style="margin-bottom: 5px;">
              <strong>${item.description}</strong> - ${item.completed ? 'Completed' : 'Not Completed'}
            </li>
          `).join('')}
        </ul>
        <p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">Please ensure you complete the checklist by the scheduled date.</p>
      `;
    case 'password':
      return `<div style="text-align: center; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; line-height: 140%; background-color: #ffffff; padding: 20px;">
  <p style="margin: 0px 0px 15px; font-size: 16px; color: #555555;">
    <strong style="color: #009a9b;">This is your OTP code:</strong>
  </p>
  <p style="margin: 0px 0px 15px; font-size: 16px; color: #555555;">
    Use it to reset your password
  </p>
  <p style="margin: 20px 0px 15px; font-size: 32px; font-weight: bold; color: #009a9b;">
    ${data}
  </p>
</div>`;
    default:
      return `<p style="margin: 0px 0px 15px; color: #555555; font-family: Roboto, sans-serif; font-size: 16px; white-space: normal; background-color: #ffffff; line-height: 140%;">You have a new notification. Please check the details in the app.</p>`;
  }
}