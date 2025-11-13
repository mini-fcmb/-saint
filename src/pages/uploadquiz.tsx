import React from "react";
import "../styles/uploadquiz.css";

const CreateQuestionModal: React.FC = () => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2>Create Quiz</h2>
          <button className="close-btn">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Form Body */}
        <div className="modal-body">
          {/* Category */}
          <div className="form-group">
            <label>Category</label>
            <select className="select-input">
              <option>Select a category</option>
              <option>Graduate</option>
              <option>New Test</option>
              <option>Work experience</option>
            </select>
          </div>

          {/* Question */}
          <div className="form-group">
            <label>Question</label>
            <input
              type="text"
              placeholder="Write here..."
              className="text-input"
            />
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label>Attach file (optional)</label>
            <div className="file-upload">
              <div className="upload-area">
                <i className="bx bx-cloud-upload"></i>
                <p>Choose a file or drag & drop it here.</p>
                <span>PDF, PNG formats, up to 10 MB</span>
              </div>
              <button className="browse-btn">Browse File</button>
            </div>
          </div>

          {/* Answer Options */}
          <div className="form-group">
            <label>Answer</label>
            <div className="answers-list">
              {[
                {
                  text: "Graduate scheme Investment ESG Analyst",
                  correct: true,
                },
                { text: "Banking Operations", correct: false },
                { text: "Blockchain", correct: false },
                { text: "Business Analyst", correct: false },
              ].map((ans, i) => (
                <div key={i} className="answer-item">
                  <input
                    type="radio"
                    name="correct"
                    defaultChecked={ans.correct}
                    className="radio-input"
                  />
                  <input
                    type="text"
                    defaultValue={ans.text}
                    className="answer-input"
                  />
                  <button className="remove-answer">
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <button className="add-more-btn">
              <i className="bx bx-plus"></i> Add More
            </button>
          </div>

          {/* Status */}
          <div className="form-group status-group">
            <label>Status</label>
            <div className="status-toggle">
              <input type="checkbox" id="status" defaultChecked />
              <label htmlFor="status" className="toggle-label">
                <span className="toggle-slider"></span>
              </label>
              <span className="status-text">Active</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="nav-btn prev">
            <i className="bx bx-chevron-left"></i> Previous
          </button>
          <div className="right-actions">
            <button className="action-btn cancel">Cancel</button>
            <button className="action-btn save">Save</button>
            <button className="action-btn next">
              Next <i className="bx bx-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestionModal;
