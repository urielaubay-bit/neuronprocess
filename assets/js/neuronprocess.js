              document.getElementById('contactForm').addEventListener('submit', async (event) => {
                  event.preventDefault();
                  const enteredCaptcha = document.getElementById('captchaInput').value;
                  const actualCaptcha = document.getElementById('captchaText').innerText;

                  if (enteredCaptcha === actualCaptcha) {
                      document.getElementById('captchaResult').innerText = '✅ CAPTCHA Verified!';
                      document.getElementById('captchaResult').style.color = 'green';
                      
                      const formData = {
                        name: document.getElementById('name').value,
                        email: document.getElementById('email').value,
                        message: document.getElementById('message').value,
                      };
                      
                      const response = await fetch('https://27ievhsom5.execute-api.us-west-2.amazonaws.com/testing/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                      });
                      document.getElementById('contactForm').querySelector('.loading').classList.add('d-block');
                      if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                        console.log(response.status);
                      }else{
                        document.getElementById('contactForm').querySelector('.loading').classList.remove('d-block');
                        document.getElementById('contactForm').querySelector('.sent-message').classList.add('d-block');
                        //document.getElementById('contactForm').querySelector('.captchaResult').classList.remove('d-block');

                      }
                      generateCaptcha();
                      const data = await response.json();
                      console.log(data);
                   } else {
                      document.getElementById('captchaResult').innerText = '❌ Incorrect CAPTCHA!';
                      document.getElementById('captchaResult').style.color = 'red';
                      generateCaptcha();
                  }
               });
             

            function generateCaptcha() {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
              let captcha = '';
                for (let i = 0; i < 6; i++) {
                    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
                }
              document.getElementById('captchaText').innerText = captcha;
            }
            // Generate an initial CAPTCHA when the page loads
            generateCaptcha();