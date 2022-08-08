document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send emails
  document.querySelector('#compose-form').onsubmit = () => {

    var recipent_list = document.querySelector('#compose-recipients');
    var subject_content = document.querySelector('#compose-subject');
    var body_message = document.querySelector('#compose-body');

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: String(recipent_list.value),
        subject: String(subject_content.value),
        body: body_message.value
      })
    })
      .then(response => response.json())
      .then(result => load_mailbox('sent'));

    return false;
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  let archive = document.querySelector('#archive');
  let unarchive = document.querySelector('#unarchive');
  archive.style.display = 'none';
  unarchive.style.display = 'none';

  let reply = document.querySelector('#reply');
  reply.style.display = 'none';

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // ... do something else with emails ...
      emails.forEach(email => {
        let div = document.createElement('div');

        div.innerHTML = `
            <span class="sender col-3"> <b>${email['sender']}</b> </span><br>
            <span class="subject col-6"> ${email['subject']} </span><br>
            <span class="timestamp col-3" style="font-size: 12px;"> ${email['timestamp']}(UTC) </span>
        `;
        div.style.border = '2px solid black';
        div.style.margin = '15px';

        div.addEventListener('click', function () {
          fetch(`/emails/${email['id']}`)
            .then(response => response.json())
            .then(email => {

              // console.log(email);
              reply.style.display = 'block';

              document.querySelector('#emails-view').style.display = 'none';
              document.querySelector('#compose-view').style.display = 'none';
              document.querySelector('#email').style.display = 'block';

              const mail = document.querySelector('#email');
              mail.innerHTML = `
                <ul style="list-style-type: none;">
                  <li><b>From:</b> ${email['sender']}</li>
                  <li><b>To:</b> ${email['recipients']}</li>
                  <li><b>Subject:</b> ${email['subject']}</li>
                  <li><b>Timestamp:</b> ${email['timestamp']}</li>
                </ul>
                <p style="margin-left:40px;">${email['body']}</p>
                `;
                // console.log("hello");
              if (!email['read']) {
                fetch(`/emails/${email['id']}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    read: true
                  })
                })
              }

              // Archive Button
              if (mailbox === 'inbox')
              {
                archive.style.display = 'block';
                archive.onsubmit = function() {
                  fetch(`/emails/${email['id']}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    archived: true
                  })
                })
                load_mailbox('inbox');
              }
              unarchive.style.display = 'none';
              }
              else if (mailbox === 'archive')
              {
                archive.style.display = 'none';
                unarchive.style.display = 'block';
                unarchive.onsubmit = function () {
                  fetch(`/emails/${email['id']}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                      archived: false
                    })
                  })
                  load_mailbox('inbox');
                }
                archive.style.display = 'none';
              }

              // Reply button
              reply.addEventListener('click', () => {
                document.querySelector('#email').style.display = 'none';
                archive.style.display = 'none';
                unarchive.style.display = 'none';
                reply.style.display = 'none';

                compose_email();
                document.querySelector('#compose-recipients').value = email['sender'];
                let subject = email['subject'];
                console.log(subject.split(" ", 1)[0]);
                if (subject.split(" ", 1)[0] != "Re:") {
                  subject = "Re: " + subject;
                }
                document.querySelector('#compose-subject').value = subject;

                let body = `
        On ${email['timestamp']}, ${email['sender']} wrote: ${email['body']}
      `;
                document.querySelector('#compose-body').value = body;
              });
            });
        });
        if (email['read'])
        {
          div.style.backgroundColor = '#E0E0E0';
        }
        document.querySelector('#emails-view').appendChild(div);
      })
      document.querySelector('#email').style.display = 'none';
    });
}