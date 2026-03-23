document.addEventListener("DOMContentLoaded", function () {
  function showAlert(message, type) {
    const alertContainer = document.getElementById("alert-container");
    alertContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  }

  function setFormToViewMode(form) {
    Array.from(form.elements).forEach(element => {
      if (element.tagName.toLowerCase() !== "button") element.disabled = true;
    });
    form.querySelector("button[type='submit']").style.display = "none";
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  function validateForm() {
    const isValid = requiredFields.every(fieldId => {
      const field = document.getElementById(fieldId);
      if (fieldId === "coursecodes") {
        return $("#coursecodes").val() && $("#coursecodes").val().length > 0;
      }
      if (fieldId === "assessmentType") {
        return (
          $("#assessmentType").val() && $("#assessmentType").val().length != 1
        );
      }
      if (fieldId === "days") {
        return field.value && field.value !== "" && !field.value.includes("⚠️");
      }
      return field.value.trim() !== "";
    });
    submitButton.disabled = !isValid;
  }

  // Transform the basic HTML <select> element (the coursecode dropdown) into a Bootstrap Select
  //     adding styling and enhancements such as search functionality
  $(document).ready(function () {
    $(".selectpicker").selectpicker();
  });

  const form = document.getElementById("Form");
  const submitButton = document.querySelector('button[type="submit"]');
  const requiredFields = [
    "firstname",
    "lastname",
    "studentid",
    "email",
    "coursecodes",
    "assessmentType",
    "assessmentDate",
    "reason"
  ];

  // Add listeners to all required fields
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (fieldId === "coursecodes") {
      $("#coursecodes").on("changed.bs.select", validateForm);
    } else if (fieldId === "assessmentType") {
      $("#assessmentType").on("changed.bs.select", validateForm);
    } else {
      field.addEventListener("input", validateForm);
      field.addEventListener("change", validateForm);
    }
  });

  // Add listener for Submit button.
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const reason = document.getElementById("reason").value;
    const comments = document.getElementById("comments").value.trim();
    // VALIDATION FOR "OTHER (details as below)"
    if (reason === "Other (details as below)" && comments === "") {
      showAlert(
        "Please provide additional comments/details for your selected reason.",
        "danger"
      );
      return;
    }

    const attachments = document.getElementById("attachments").files;
    const attachmentsBase64 = [];
    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i];
        try {
          const base64 = await fileToBase64(file);
          attachmentsBase64.push({ filename: file.name, content: base64 });
        } catch (error) {
          showAlert("Failed to process attachments.", "danger");
          return;
        }
      }
    }

    const selectedModules = $("#coursecodes").val() || [];
    const formData = {
      studentid: form.studentid.value,
      firstname: form.firstname.value,
      lastname: form.lastname.value,
      email: form.email.value,
      coursecodes: selectedModules,
      assessmentType: form.assessmentType.value,
      assessmentDate: form.assessmentDate.value,
      reason: form.reason.value,
      comments: form.comments.value,
      attachments: attachmentsBase64
    };

    try {
      const handlerUrl =
        "https://5ba17b8c45b4e82f9ee71eecf21efa.46.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3118e79aab2740cb915f45b1ab0443ca/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ks6H39UckFsa4tSfc65VQcokHYwsYGN8UZdOIWpx7sA";
      // POST Form data to Power Automate handler
      const response = await fetch(handlerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        $("#successModal").modal("show");
        setFormToViewMode(form);
      } else {
        showAlert("There was a problem submitting the form.", "danger");
      }
    } catch (error) {
      showAlert("Error submitting form.", "danger");
    }
  });

  // Initial validation
  validateForm();
});
